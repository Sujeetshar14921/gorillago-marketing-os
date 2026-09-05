import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  OAUTH_PROVIDERS,
  OAuthPlatform,
  generateOAuthState,
  getAppBaseUrl,
  isProviderConfigured,
} from '@/lib/oauth/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const platform = params.platform as OAuthPlatform;
    const config = OAUTH_PROVIDERS[platform];

    if (!config) {
      return NextResponse.json(
        { error: `Invalid or unsupported platform: ${params.platform}` },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    // Get orgId from search params or user's active organization
    const { searchParams } = new URL(request.url);
    let orgId = searchParams.get('orgId');

    if (!orgId) {
      const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      orgId = member?.organization_id ?? null;
    }

    if (!orgId) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?tab=integrations&error=no_organization', request.url)
      );
    }

    // If real API credentials are not configured in environment, redirect to settings with unconfigured notice
    if (!isProviderConfigured(platform)) {
      return NextResponse.redirect(
        new URL(
          `/dashboard/settings?tab=integrations&unconfigured=${platform}&orgId=${orgId}`,
          request.url
        )
      );
    }

    // Generate secure state
    const redirectPath = searchParams.get('redirectPath') || '/dashboard/settings?tab=integrations';
    const state = generateOAuthState(orgId, platform, redirectPath);

    const baseUrl = getAppBaseUrl();
    const redirectUri = `${baseUrl}/api/auth/oauth/${platform}/callback`;

    // Construct authorization URL
    const authParams = new URLSearchParams({
      client_id: config.clientId || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: config.scopes.join(platform === 'facebook' || platform === 'instagram' ? ',' : ' '),
      state,
    });

    if (platform === 'google_ads') {
      authParams.set('access_type', 'offline');
      authParams.set('prompt', 'consent');
    }

    const targetAuthUrl = `${config.authUrl}?${authParams.toString()}`;
    return NextResponse.redirect(targetAuthUrl);
  } catch (err: any) {
    console.error('OAuth authorization error:', err);
    return NextResponse.redirect(
      new URL('/dashboard/settings?tab=integrations&error=oauth_initiation_failed', request.url)
    );
  }
}
