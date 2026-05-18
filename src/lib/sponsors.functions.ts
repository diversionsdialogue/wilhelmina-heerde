import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Sponsor = {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
  is_active: boolean;
};

/** Publieke lijst — alleen actieve sponsors, gesorteerd. */
export const getPublicSponsors = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("sponsors")
    .select("id, name, logo_url, website_url, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Sponsor[];
});

/** Admin: alles ophalen (incl. inactief). */
export const listSponsors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: canEdit, error: roleErr } = await supabaseAdmin.rpc("is_content_editor", {
      _user_id: context.userId,
    });
    if (roleErr) throw roleErr;
    if (!canEdit) throw new Error("Geen rechten.");

    const { data, error } = await supabaseAdmin
      .from("sponsors")
      .select("id, name, logo_url, website_url, sort_order, is_active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Sponsor[];
  });

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  logo_url: z.string().max(1000).nullable(),
  website_url: z.string().max(1000).nullable(),
  sort_order: z.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

export const upsertSponsor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: canEdit, error: roleErr } = await supabaseAdmin.rpc("is_content_editor", {
      _user_id: context.userId,
    });
    if (roleErr) throw roleErr;
    if (!canEdit) throw new Error("Geen rechten.");

    if (data.id) {
      const { error } = await supabaseAdmin.from("sponsors").update({
        name: data.name,
        logo_url: data.logo_url,
        website_url: data.website_url,
        sort_order: data.sort_order,
        is_active: data.is_active,
      }).eq("id", data.id);
      if (error) throw error;
      return { id: data.id };
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("sponsors")
      .insert({
        name: data.name,
        logo_url: data.logo_url,
        website_url: data.website_url,
        sort_order: data.sort_order,
        is_active: data.is_active,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { id: inserted.id as string };
  });

export const deleteSponsor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: canEdit, error: roleErr } = await supabaseAdmin.rpc("is_content_editor", {
      _user_id: context.userId,
    });
    if (roleErr) throw roleErr;
    if (!canEdit) throw new Error("Geen rechten.");

    const { error } = await supabaseAdmin.from("sponsors").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
