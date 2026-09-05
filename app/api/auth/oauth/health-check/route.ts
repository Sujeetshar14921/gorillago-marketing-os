import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { testTokenHealth } from '@/lib/oauth/config';

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
    const { accountId, orgId, type = 'social' } = body;

    if (!accountId || !orgId) {
      return NextResponse.json(
        { error: 'accountId and orgId are required' },
        { status: 400 }
      );
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

    if (type === 'social') {
      const { data: account, error: accError } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('organization_id', orgId)
        .single();

      if (accError || !account) {
        return NextResponse.json({ error: 'Social account not found' }, { status: 404 });
      }

      const result = await testTokenHealth(
        account.platform,
        account.access_token || '',
        account.account_id
      );

      // Update in DB
      await supabase
        .from('social_accounts')
        .update({
          health_status: result.status,
          last_health_check_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', accountId);

      return NextResponse.json({ success: true, health: result });
    } else {
      // Integration check
      const { data: integration, error: intError } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', accountId)
        .eq('organization_id', orgId)
        .single();

      if (intError || !integration) {
        return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
      }

      const isSandbox = Boolean(integration.credentials?.is_sandbox);
      const newStatus = isSandbox || integration.credentials?.access_token ? 'connected' : 'disconnected';

      await supabase
        .from('integrations')
        .update({
          status: newStatus,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', accountId);

      return NextResponse.json({
        success: true,
        health: {
          healthy: newStatus === 'connected',
          status: newStatus,
          message: `${integration.name} connection active.`,
        },
      });
    }
  } catch (err: any) {
    console.error('Health check error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to check account health' },
      { status: 500 }
    );
  }
}
