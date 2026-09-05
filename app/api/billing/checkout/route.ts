import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  isStripeConfigured,
  isRazorpayConfigured,
  createStripeCheckoutSession,
  createRazorpayOrder,
  PLAN_PRICING,
  CREDIT_PACKS,
  CreditPackId,
} from '@/lib/billing/gateway';
import type { BillingPlan } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      orgId,
      type = 'subscription', // 'subscription' | 'credit_pack'
      plan,
      creditPackId,
      provider = 'auto', // 'stripe' | 'razorpay' | 'sandbox' | 'auto'
    } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Verify membership
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: 'Forbidden: Invalid organization membership' }, { status: 403 });
    }

    // Get current subscription (for customer ID if exists)
    const { data: currentSub } = await supabase
      .from('billing_subscriptions')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();

    const stripeReady = isStripeConfigured();
    const razorpayReady = isRazorpayConfigured();

    // 1. Stripe Checkout Flow
    if ((provider === 'stripe' || provider === 'auto') && stripeReady) {
      try {
        const session = await createStripeCheckoutSession({
          orgId,
          userId: user.id,
          customerEmail: user.email,
          stripeCustomerId: currentSub?.stripe_customer_id,
          mode: type === 'subscription' ? 'subscription' : 'payment',
          plan: plan as BillingPlan,
          creditPackId: creditPackId as CreditPackId,
        });

        return NextResponse.json({
          provider: 'stripe',
          url: session.url,
          sessionId: session.sessionId,
        });
      } catch (err: any) {
        console.warn('Stripe checkout error, falling back to sandbox if requested:', err.message);
        if (provider === 'stripe') {
          return NextResponse.json({ error: err.message }, { status: 500 });
        }
      }
    }

    // 2. Razorpay Order Flow
    if (provider === 'razorpay' && razorpayReady) {
      const priceUsd =
        type === 'subscription' && plan
          ? PLAN_PRICING[plan as BillingPlan]?.priceUsd || 0
          : creditPackId
          ? CREDIT_PACKS[creditPackId as CreditPackId]?.priceUsd || 0
          : 0;

      const order = await createRazorpayOrder({
        orgId,
        amountUsd: priceUsd,
        receipt: `rcpt_${Date.now().toString().slice(-8)}`,
        notes: {
          type,
          plan: plan || '',
          creditPackId: creditPackId || '',
        },
      });

      return NextResponse.json({
        provider: 'razorpay',
        ...order,
      });
    }

    // 3. Sandbox / Developer Simulator Mode
    return NextResponse.json({
      provider: 'sandbox',
      isSandbox: true,
      orgId,
      type,
      plan: plan || null,
      creditPackId: creditPackId || null,
      message: 'Payment gateways not configured in .env. Sandbox simulation ready.',
    });
  } catch (err: any) {
    console.error('Checkout API error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to initiate checkout' },
      { status: 500 }
    );
  }
}
