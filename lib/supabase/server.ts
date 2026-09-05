import { createServerClient as createSSRClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

/**
 * Server-side Supabase client that reads/writes session cookies.
 * Use this in Server Components and Route Handlers.
 * RLS applies based on the authenticated user's session.
 */
export async function createServerClient() {
  const cookieStore = cookies();

  return createSSRClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — cookies can only be set
          // from a Route Handler or Server Action. This is safe to
          // ignore because middleware will refresh the session.
        }
      },
    },
  });
}

/**
 * Server-side Supabase client with the service role key.
 * BYPASSES RLS. Use ONLY in edge functions or server routes that need
 * privileged access (e.g. system-level operations, webhooks).
 * NEVER expose this to the client.
 */
export function createServiceClient() {
  return createSSRClient(supabaseUrl, supabaseServiceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Creates a Supabase client for middleware (edge runtime).
 * Reads and updates the session token from request/response cookies.
 */
export function createMiddlewareClient(request: NextRequest) {
  return createSSRClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
      },
    },
  });
}
