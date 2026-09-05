import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { verifyStripeWebhookSignature, PLAN_PRICING, CREDIT_PACKS, CreditPackId } from '@/lib/billing/gateway';
import type { BillingPlan, CreditType } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // Verify signature if secret is configured
    if (webhookSecret && signature) {
      const isValid = verifyStripeWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid Stripe webhook signature.');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const supabase = createServiceClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const metadata = session.metadata || {};
        const orgId = metadata.orgId;
        const type = metadata.type;

        if (!orgId) break;

        if (type === 'subscription') {
          const plan = (metadata.plan as BillingPlan) || 'starter';
          const customerId = session.customer;
          const subscriptionId = session.subscription;

          // 1. Update subscription status & auto-grant monthly credits
          const { data: subId } = await supabase.rpc('update_subscription_status', {
            p_org_id: orgId,
            p_plan: plan,
            p_status: 'active',
            p_stripe_customer_id: customerId || null,
            p_stripe_subscription_id: subscriptionId || null,
          });

          // 2. Record invoice
          const amount = (session.amount_total || 0) / 100;
          await supabase.rpc('record_paid_invoice', {
            p_org_id: orgId,
            p_subscription_id: subId || null,
            p_amount: amount,
            p_currency: session.currency?.toUpperCase() || 'USD',
            p_stripe_invoice_id: session.invoice || session.id,
            p_invoice_url: null,
          });
        } else if (type === 'credit_pack') {
          const creditType = metadata.creditType as CreditType;
          const amount = parseInt(metadata.amount || '0', 10);
          const price = (session.amount_total || 0) / 100;

          if (creditType && amount > 0) {
            // Grant topup credits
            await supabase.rpc('grant_topup_credits', {
              p_org_id: orgId,
              p_credit_type: creditType,
              p_amount: amount,
              p_description: `Stripe Checkout: +${amount} ${creditType} credits`,
              p_reference_id: session.id,
            });

            // Record invoice
            await supabase.rpc('record_paid_invoice', {
              p_org_id: orgId,
              p_subscription_id: null,
              p_amount: price,
              p_currency: session.currency?.toUpperCase() || 'USD',
              p_stripe_invoice_id: session.id,
              p_invoice_url: null,
            });
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        const subscriptionId = invoice.subscription;

        if (subscriptionId) {
          // Find organization by customer ID or subscription ID
          const { data: sub } = await supabase
            .from('billing_subscriptions')
            .select('organization_id, plan')
            .or(`stripe_subscription_id.eq.${subscriptionId},stripe_customer_id.eq.${customerId}`)
            .maybeSingle();

          if (sub?.organization_id) {
            // Refresh monthly quota
            await supabase.rpc('grant_plan_credits', {
              p_org_id: sub.organization_id,
              p_plan: sub.plan,
            });

            // Record invoice
            const amount = (invoice.amount_paid || 0) / 100;
            await supabase.rpc('record_paid_invoice', {
              p_org_id: sub.organization_id,
              p_subscription_id: null,
              p_amount: amount,
              p_currency: invoice.currency?.toUpperCase() || 'USD',
              p_stripe_invoice_id: invoice.id,
              p_invoice_url: invoice.hosted_invoice_url || null,
            });
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const subscriptionId = sub.id;

        await supabase
          .from('billing_subscriptions')
          .update({
            status: 'canceled',
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscriptionId);
        break;
      }

      default:
        // Ignore unhandled events
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Stripe webhook processing error:', err);
    return NextResponse.json(
      { error: err?.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
