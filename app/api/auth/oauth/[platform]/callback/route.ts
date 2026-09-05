import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  OAUTH_PROVIDERS,
  OAuthPlatform,
  verifyOAuthState,
  exchangeCodeForTokens,
  fetchPlatformAccounts,
  getAppBaseUrl,
} from '@/lib/oauth/config';

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const platform = params.platform as OAuthPlatform;
  const { searchParams } = new URL(request.url);

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    console.warn(`OAuth error from ${platform}:`, error, errorDescription);
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings?tab=integrations&error=${encodeURIComponent(
          errorDescription || error
        )}`,
        request.url
      )
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?tab=integrations&error=missing_code_or_state', request.url)
    );
  }

  // 1. Verify CSRF State
  const statePayload = verifyOAuthState(state);
  if (!statePayload || statePayload.platform !== platform) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?tab=integrations&error=invalid_or_expired_state', request.url)
    );
  }

  const { orgId, redirectPath = '/dashboard/settings?tab=integrations' } = statePayload;

  try {
    const supabase = await createServerClient();
    const baseUrl = getAppBaseUrl();
    const redirectUri = `${baseUrl}/api/auth/oauth/${platform}/callback`;

    // 2. Exchange authorization code for access tokens
    const tokens = await exchangeCodeForTokens(platform, code, redirectUri);

    // 3. Platform specific account discovery & saving
    if (platform === 'facebook' || platform === 'instagram' || platform === 'linkedin') {
      const accounts = await fetchPlatformAccounts(platform, tokens.access_token);

      for (const acc of accounts) {
        // Upsert into social_accounts table
        await supabase
          .from('social_accounts')
          .upsert(
            {
              organization_id: orgId,
              platform: acc.platform,
              account_name: acc.accountName,
              account_id: acc.accountId,
              access_token: acc.accessToken,
              refresh_token: tokens.refresh_token || null,
              token_expires_at: tokens.expires_in
                ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
                : null,
              scopes: OAUTH_PROVIDERS[platform]?.scopes || [],
              health_status: 'healthy',
              last_health_check_at: new Date().toISOString(),
              metadata: acc.metadata,
              is_connected: true,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'organization_id,platform,account_id',
            }
          );
      }
    } else if (platform === 'google_ads') {
      // Upsert into integrations table
      await supabase.from('integrations').upsert(
        {
          organization_id: orgId,
          type: 'google_ads',
          name: 'Google Ads Account',
          status: 'connected',
          credentials: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at: tokens.expires_in
              ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
              : null,
          },
          metadata: { provider: 'google' },
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'organization_id,type',
        }
      );
    }

    // 4. Redirect user back with success query param
    const returnUrl = new URL(redirectPath, request.url);
    returnUrl.searchParams.set('tab', 'integrations');
    returnUrl.searchParams.set('connected', 'true');
    returnUrl.searchParams.set('platform', platform);
    return NextResponse.redirect(returnUrl);
  } catch (err: any) {
    console.error(`Error completing OAuth callback for ${platform}:`, err);
    return NextResponse.redirect(
      new URL(
        `/dashboard/settings?tab=integrations&error=${encodeURIComponent(
          err?.message || 'Token exchange failed'
        )}`,
        request.url
      )
    );
  }
}
