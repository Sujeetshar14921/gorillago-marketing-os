import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { SocialPlatform } from '@/types/database';

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
      platform,
      accountName,
      accountId,
      accessToken,
      isSandbox = false,
      type = 'social', // 'social' | 'ad'
    } = body;

    if (!orgId || !platform || !accountName) {
      return NextResponse.json(
        { error: 'Missing required parameters: orgId, platform, accountName' },
        { status: 400 }
      );
    }

    // Verify user belongs to org
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: 'Forbidden: You do not belong to this organization' },
        { status: 403 }
      );
    }

    const effectiveAccountId =
      accountId ||
      (isSandbox
        ? `sb_${platform}_${Date.now().toString().slice(-6)}`
        : `ext_${Date.now().toString().slice(-6)}`);

    const effectiveToken =
      accessToken ||
      (isSandbox
        ? `sb_token_${platform}_${Math.random().toString(36).substring(2, 10)}`
        : null);

    if (type === 'social') {
      const { data, error } = await supabase
        .from('social_accounts')
        .upsert(
          {
            organization_id: orgId,
            platform: platform as SocialPlatform,
            account_name: accountName,
            account_id: effectiveAccountId,
            access_token: effectiveToken,
            token_expires_at: isSandbox
              ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
              : null,
            scopes: isSandbox ? ['sandbox_full_access'] : ['custom_token'],
            health_status: 'healthy',
            last_health_check_at: new Date().toISOString(),
            metadata: { is_sandbox: isSandbox, configured_manually: true },
            is_connected: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id,platform,account_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } else {
      // Ad platform or integration (e.g. google_ads, meta_ads)
      const { data, error } = await supabase
        .from('integrations')
        .upsert(
          {
            organization_id: orgId,
            type: platform,
            name: accountName,
            status: 'connected',
            credentials: {
              account_id: effectiveAccountId,
              access_token: effectiveToken,
              is_sandbox: isSandbox,
            },
            metadata: { is_sandbox: isSandbox, configured_manually: true },
            last_synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id,type' }
        )
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }
  } catch (err: any) {
    console.error('Manual connection error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to connect account manually' },
      { status: 500 }
    );
  }
}
