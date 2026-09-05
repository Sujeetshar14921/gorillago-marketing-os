import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

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
    const { accountId, orgId, type = 'social', deletePermanently = false } = body;

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
      if (deletePermanently) {
        await supabase
          .from('social_accounts')
          .delete()
          .eq('id', accountId)
          .eq('organization_id', orgId);
      } else {
        await supabase
          .from('social_accounts')
          .update({
            is_connected: false,
            health_status: 'disconnected',
            access_token: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', accountId)
          .eq('organization_id', orgId);
      }
    } else {
      // Integration
      if (deletePermanently) {
        await supabase
          .from('integrations')
          .delete()
          .eq('id', accountId)
          .eq('organization_id', orgId);
      } else {
        await supabase
          .from('integrations')
          .update({
            status: 'disconnected',
            credentials: {},
            updated_at: new Date().toISOString(),
          })
          .eq('id', accountId)
          .eq('organization_id', orgId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Disconnect error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to disconnect account' },
      { status: 500 }
    );
  }
}
