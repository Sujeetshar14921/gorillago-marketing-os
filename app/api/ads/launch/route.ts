import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { dispatchCustomerFeedAd } from '@/lib/ads/engine';
import type { CampaignAd } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Please log in to launch ads.' }, { status: 401 });
    }

    const body = await request.json();
    const { adId } = body;

    if (!adId) {
      return NextResponse.json({ error: 'Ad ID is required' }, { status: 400 });
    }

    // 1. Fetch Ad
    const { data: ad, error: adError } = await supabase
      .from('campaign_ads')
      .select('*')
      .eq('id', adId)
      .single();

    if (adError || !ad) {
      return NextResponse.json({ error: 'Campaign Ad not found' }, { status: 404 });
    }

    const campaignAd = ad as CampaignAd;

    // 2. Dispatch to customer feeds via Agency Ad Gateway
    const result = await dispatchCustomerFeedAd(campaignAd);

    if (result.success && result.externalAdId) {
      await supabase
        .from('campaign_ads')
        .update({
          status: 'active',
          external_ad_id: result.externalAdId,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', adId);

      return NextResponse.json({
        success: true,
        adId,
        externalAdId: result.externalAdId,
        audienceReachEstimate: result.audienceReachEstimate,
        message: result.message || 'Ad successfully launched to targeted customer feeds!',
      });
    } else {
      await supabase
        .from('campaign_ads')
        .update({
          status: 'failed',
          error_message: result.error || 'Failed to dispatch to ad network',
          updated_at: new Date().toISOString(),
        })
        .eq('id', adId);

      return NextResponse.json(
        { error: result.error || 'Ad launch failed' },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error('Error launching ad:', err);
    return NextResponse.json(
      { error: err?.message || 'Server error while launching ad to customer feeds.' },
      { status: 500 }
    );
  }
}
