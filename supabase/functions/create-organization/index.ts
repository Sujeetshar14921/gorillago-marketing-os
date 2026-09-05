import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

    // Create a service-role client that bypasses RLS
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Get the user's JWT from the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify the user's session
    const {
      data: { user },
      error: userError,
    } = await serviceClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const orgName: string = body.org_name || user.user_metadata?.org_name || "My Organization";
    const userName: string = body.user_name || user.user_metadata?.full_name || "";

    // Generate a unique slug
    const baseSlug = slugify(orgName) || "organization";
    let slug = baseSlug;
    let suffix = 1;

    // Check for slug conflicts
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data: existing } = await serviceClient
        .from("organizations")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!existing) break;
      suffix++;
      slug = `${baseSlug}-${suffix}`;
    }

    // Create the organization
    const { data: org, error: orgError } = await serviceClient
      .from("organizations")
      .insert({
        name: orgName,
        slug: slug,
        plan: "free",
        owner_id: user.id,
      })
      .select()
      .single();

    if (orgError || !org) {
      return new Response(
        JSON.stringify({ error: "Failed to create organization", details: orgError?.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add the user as the organization owner
    const { error: memberError } = await serviceClient
      .from("organization_members")
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: "business_owner",
        status: "active",
      });

    if (memberError) {
      // If member insert fails, the org was still created.
      // We'll still return success so the user can proceed.
      console.error("Failed to add member:", memberError.message);
    }

    // Create default organization settings
    await serviceClient
      .from("organization_settings")
      .insert({
        organization_id: org.id,
      });

    // Create user profile (upsert in case it already exists)
    await serviceClient
      .from("user_profiles")
      .upsert({
        user_id: user.id,
        email: user.email ?? "",
        full_name: userName,
      }, { onConflict: "user_id" });

    // Update user metadata with org reference
    await serviceClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        full_name: userName,
        organization_id: org.id,
      },
    });

    return new Response(
      JSON.stringify({
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
        },
        role: "business_owner",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
