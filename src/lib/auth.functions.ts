import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Returns the current user's role(s) and a convenience flag for admin/content_manager.
 * Bootstrap: william@diversions.nl is auto-promoted to admin on first call.
 */
export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId, claims } = context;
    const email = (claims as { email?: string })?.email ?? null;

    // Bootstrap: ensure william@diversions.nl is admin.
    if (email === "william@diversions.nl") {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    }

    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) throw error;

    const roles = (data ?? []).map((r) => r.role);
    return {
      userId,
      email,
      roles,
      isAdmin: roles.includes("admin"),
      isContentEditor: roles.includes("admin") || roles.includes("content_manager"),
    };
  });
