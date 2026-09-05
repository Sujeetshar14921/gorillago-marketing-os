import { NextRequest } from 'next/server';
import { getAuthenticatedOrg } from '@/server/http/auth';
import { apiSuccess, apiError, apiUnauthorized } from '@/server/http/response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName } = body;

    const { context, error } = await getAuthenticatedOrg();
    if (error || !context) {
      return apiUnauthorized(error || 'Authentication required');
    }

    const { data, error: upsertError } = await context.supabase
      .from('user_profiles')
      .upsert(
        {
          user_id: context.userId,
          email: email || context.user.email,
          full_name: fullName,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (upsertError) throw upsertError;

    return apiSuccess(data);
  } catch (err: any) {
    console.error('API /api/auth/profile POST error:', err);
    return apiError(err?.message || 'Failed to update user profile');
  }
}
