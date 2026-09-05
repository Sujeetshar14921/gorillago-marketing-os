import crypto from 'crypto';
import type { BillingPlan, CreditType } from '@/types/database';
import { getAppBaseUrl } from '@/lib/oauth/config';

export interface PlanPricing {
  id: BillingPlan;
  name: string;
  priceUsd: number;
  credits: { content: number; image: number; video: number };
  stripePriceId?: string;
}

export const PLAN_PRICING: Record<BillingPlan, PlanPricing> = {
  free: {
    id: 'free',
    name: 'Free',
    priceUsd: 0,
    credits: { content: 10, image: 2, video: 0 },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    priceUsd: 19,
    credits: { content: 100, image: 20, video: 5 },
    stripePriceId: process.env.STRIPE_PRICE_STARTER,
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    priceUsd: 49,
    credits: { content: 500, image: 100, video: 20 },
    stripePriceId: process.env.STRIPE_PRICE_GROWTH,
  },
  agency: {
    id: 'agency',
    name: 'Agency',
    priceUsd: 149,
    credits: { content: 2000, image: 500, video: 100 },
    stripePriceId: process.env.STRIPE_PRICE_AGENCY,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceUsd: 499,
    credits: { content: 10000, image: 3000, video: 500 },
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE,
  },
};

export type CreditPackId = 'content_500' | 'image_100' | 'video_20';

export interface CreditPack {
  id: CreditPackId;
  name: string;
  creditType: CreditType;
  amount: number;
  priceUsd: number;
}

export const CREDIT_PACKS: Record<CreditPackId, CreditPack> = {
  content_500: {
    id: 'content_500',
    name: '+500 AI Content Credits',
    creditType: 'content',
    amount: 500,
    priceUsd: 10,
  },
  image_100: {
    id: 'image_100',
    name: '+100 AI Image Credits',
    creditType: 'image',
    amount: 100,
    priceUsd: 15,
  },
  video_20: {
    id: 'video_20',
    name: '+20 AI Video Credits',
    creditType: 'video',
    amount: 20,
    priceUsd: 25,
  },
};

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/**
 * Creates a Stripe Checkout Session for subscription plans or one-time credit packs
 */
export async function createStripeCheckoutSession(params: {
  orgId: string;
  userId: string;
  customerEmail?: string;
  stripeCustomerId?: string | null;
  mode: 'subscription' | 'payment';
  plan?: BillingPlan;
  creditPackId?: CreditPackId;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<{ url: string; sessionId: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('Stripe is not configured in environment');

  const baseUrl = getAppBaseUrl();
  const successUrl = params.successUrl || `${baseUrl}/dashboard/billing?payment=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = params.cancelUrl || `${baseUrl}/dashboard/billing?payment=cancelled`;

  const bodyParams = new URLSearchParams();
  bodyParams.set('success_url', successUrl);
  bodyParams.set('cancel_url', cancelUrl);
  bodyParams.set('mode', params.mode);

  if (params.stripeCustomerId) {
    bodyParams.set('customer', params.stripeCustomerId);
  } else if (params.customerEmail) {
    bodyParams.set('customer_email', params.customerEmail);
  }

  // Metadata
  bodyParams.set('metadata[orgId]', params.orgId);
  bodyParams.set('metadata[userId]', params.userId);

  if (params.mode === 'subscription' && params.plan) {
    const planInfo = PLAN_PRICING[params.plan];
    bodyParams.set('metadata[plan]', params.plan);
    bodyParams.set('metadata[type]', 'subscription');

    if (planInfo.stripePriceId) {
      bodyParams.set('line_items[0][price]', planInfo.stripePriceId);
      bodyParams.set('line_items[0][quantity]', '1');
    } else {
      // Dynamic price data
      bodyParams.set('line_items[0][price_data][currency]', 'usd');
      bodyParams.set('line_items[0][price_data][product_data][name]', `GorillaGo ${planInfo.name} Plan`);
      bodyParams.set('line_items[0][price_data][recurring][interval]', 'month');
      bodyParams.set('line_items[0][price_data][unit_amount]', String(planInfo.priceUsd * 100));
      bodyParams.set('line_items[0][quantity]', '1');
    }
  } else if (params.mode === 'payment' && params.creditPackId) {
    const pack = CREDIT_PACKS[params.creditPackId];
    bodyParams.set('metadata[creditPackId]', pack.id);
    bodyParams.set('metadata[creditType]', pack.creditType);
    bodyParams.set('metadata[amount]', String(pack.amount));
    bodyParams.set('metadata[type]', 'credit_pack');

    bodyParams.set('line_items[0][price_data][currency]', 'usd');
    bodyParams.set('line_items[0][price_data][product_data][name]', `GorillaGo ${pack.name}`);
    bodyParams.set('line_items[0][price_data][unit_amount]', String(pack.priceUsd * 100));
    bodyParams.set('line_items[0][quantity]', '1');
  }

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  const session = await res.json();
  if (!res.ok || session.error) {
    throw new Error(session.error?.message || 'Failed to create Stripe Checkout session');
  }

  return { url: session.url, sessionId: session.id };
}

/**
 * Creates a Stripe Billing Customer Portal session
 */
export async function createStripePortalSession(customerId: string, returnUrl?: string): Promise<string> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('Stripe is not configured in environment');

  const baseUrl = getAppBaseUrl();
  const retUrl = returnUrl || `${baseUrl}/dashboard/billing`;

  const params = new URLSearchParams();
  params.set('customer', customerId);
  params.set('return_url', retUrl);

  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to create Stripe customer portal session');
  }

  return data.url;
}

/**
 * Creates a Razorpay Order for one-time payments or UPI
 */
export async function createRazorpayOrder(params: {
  orgId: string;
  amountUsd: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ orderId: string; keyId: string; amount: number; currency: string }> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay is not configured in environment');
  }

  // Convert USD to INR approximate (e.g. 1 USD ~ 83 INR) or direct INR subunits
  const inrAmountPaise = Math.round(params.amountUsd * 83 * 100);

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: inrAmountPaise,
      currency: 'INR',
      receipt: params.receipt,
      notes: {
        orgId: params.orgId,
        ...params.notes,
      },
    }),
  });

  const order = await res.json();
  if (!res.ok || order.error) {
    throw new Error(order.error?.description || 'Failed to create Razorpay order');
  }

  return {
    orderId: order.id,
    keyId,
    amount: order.amount,
    currency: order.currency,
  };
}

/**
 * Verifies Stripe webhook signature using HMAC-SHA256
 */
export function verifyStripeWebhookSignature(
  payload: string,
  signatureHeader: string,
  secret: string
): boolean {
  try {
    const items = signatureHeader.split(',');
    let timestamp = '';
    let signature = '';

    for (const item of items) {
      const [key, value] = item.trim().split('=');
      if (key === 't') timestamp = value;
      if (key === 'v1') signature = value;
    }

    if (!timestamp || !signature) return false;

    // Reject events older than 10 minutes
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - parseInt(timestamp, 10)) > 600) {
      return false;
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload, 'utf8')
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch {
    return false;
  }
}
