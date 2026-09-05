import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isStripeConfigured, createStripePortalSession } from '@/lib/billing/gateway';

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
    const { orgId, returnUrl } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured in environment. Customer portal is unavailable.' },
        { status: 400 }
      );
    }

    const { data: subscription } = await supabase
      .from('billing_subscriptions')
      .select('stripe_customer_id')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (!subscription?.stripe_customer_id || subscription.stripe_customer_id.startsWith('cus_sb_')) {
      return NextResponse.json(
        { error: 'No active Stripe customer found. Please subscribe via Stripe first.' },
        { status: 404 }
      );
    }

    const portalUrl = await createStripePortalSession(subscription.stripe_customer_id, returnUrl);
    return NextResponse.json({ url: portalUrl });
  } catch (err: any) {
    console.error('Stripe Customer Portal error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to open customer portal' },
      { status: 500 }
    );
  }
}
