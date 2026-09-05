import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { PLAN_PRICING, CREDIT_PACKS, CreditPackId } from '@/lib/billing/gateway';
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
    const { orgId, type = 'subscription', plan, creditPackId } = body;

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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    if (type === 'subscription' && plan) {
      const planInfo = PLAN_PRICING[plan as BillingPlan] || PLAN_PRICING.starter;
      const fakeInvoiceId = `in_sb_${Date.now().toString().slice(-8)}`;

      // 1. Update subscription status & auto-grant monthly credits
      const { data: subId, error: subErr } = await supabase.rpc('update_subscription_status', {
        p_org_id: orgId,
        p_plan: plan,
        p_status: 'active',
        p_stripe_customer_id: `cus_sb_${user.id.slice(0, 8)}`,
        p_stripe_subscription_id: `sub_sb_${Date.now()}`,
        p_period_start: now.toISOString(),
        p_period_end: periodEnd.toISOString(),
      });

      if (subErr) throw subErr;

      // 2. Record paid invoice
      const { data: invoiceId, error: invErr } = await supabase.rpc('record_paid_invoice', {
        p_org_id: orgId,
        p_subscription_id: subId,
        p_amount: planInfo.priceUsd,
        p_currency: 'USD',
        p_stripe_invoice_id: fakeInvoiceId,
        p_invoice_url: null,
        p_period_start: now.toISOString(),
        p_period_end: periodEnd.toISOString(),
      });

      if (invErr) throw invErr;

      return NextResponse.json({
        success: true,
        type: 'subscription',
        plan,
        amount: planInfo.priceUsd,
        invoiceId,
        message: `Sandbox payment successful! Switched to ${planInfo.name} plan.`,
      });
    }

    if (type === 'credit_pack' && creditPackId) {
      const pack = CREDIT_PACKS[creditPackId as CreditPackId];
      if (!pack) throw new Error('Invalid credit pack selected');

      const fakeInvoiceId = `in_sb_pack_${Date.now().toString().slice(-8)}`;

      // 1. Grant topup credits
      const { data: topupResult, error: topupErr } = await supabase.rpc('grant_topup_credits', {
        p_org_id: orgId,
        p_credit_type: pack.creditType,
        p_amount: pack.amount,
        p_description: `Purchased ${pack.name} (Sandbox)`,
        p_reference_id: fakeInvoiceId,
      });

      if (topupErr) throw topupErr;

      // 2. Record paid invoice
      const { data: invoiceId, error: invErr } = await supabase.rpc('record_paid_invoice', {
        p_org_id: orgId,
        p_subscription_id: null,
        p_amount: pack.priceUsd,
        p_currency: 'USD',
        p_stripe_invoice_id: fakeInvoiceId,
        p_invoice_url: null,
        p_period_start: now.toISOString(),
        p_period_end: now.toISOString(),
      });

      if (invErr) throw invErr;

      return NextResponse.json({
        success: true,
        type: 'credit_pack',
        pack: pack.name,
        amount: pack.priceUsd,
        topupResult,
        invoiceId,
        message: `Sandbox payment successful! Added ${pack.amount} ${pack.creditType} credits.`,
      });
    }

    return NextResponse.json({ error: 'Invalid payment parameters' }, { status: 400 });
  } catch (err: any) {
    console.error('Sandbox confirmation error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to complete sandbox payment' },
      { status: 500 }
    );
  }
}
