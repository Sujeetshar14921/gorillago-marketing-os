import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { syncOrganizationAnalytics } from '@/lib/analytics/engine';

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
    const { orgId, days = 30 } = body;

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Verify user belongs to organization
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

    // Run synchronization pipeline
    const syncResult = await syncOrganizationAnalytics(supabase, orgId, days);

    return NextResponse.json({
      success: true,
      ...syncResult,
    });
  } catch (err: any) {
    console.error('Analytics sync API error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to synchronize live analytics' },
      { status: 500 }
    );
  }
}
