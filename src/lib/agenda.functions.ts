import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AgendaCategory = "concert" | "educatie" | "optreden";

export type AgendaItem = {
  id: string;
  starts_at: string;
  image_url: string | null;
  category: AgendaCategory;
  location: string | null;
  title: string;
  description: string | null;
  hide_on_homepage: boolean;
};

export const listAgendaItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: canEdit, error: roleErr } = await supabaseAdmin.rpc("is_content_editor", { _user_id: userId });
    if (roleErr) throw roleErr;
    if (!canEdit) throw new Error("Geen rechten.");

    const { data, error } = await supabaseAdmin
      .from("agenda_items")
      .select("id, starts_at, image_url, category, location, title, description, hide_on_homepage")
      .order("starts_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as AgendaItem[];
  });

export const getUpcomingAgenda = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("agenda_items")
    .select("id, starts_at, image_url, category, location, title, description, hide_on_homepage")
    .eq("hide_on_homepage", false)
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(6);
  if (error) throw error;
  return (data ?? []) as AgendaItem[];
});

/** Volledige publieke agenda. Items verdwijnen automatisch de dag na het optreden. */
export const listPublicAgenda = createServerFn({ method: "GET" }).handler(async () => {
  // Start van vandaag in lokale tijd (Europe/Amsterdam ~ UTC).
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const { data, error } = await supabaseAdmin
    .from("agenda_items")
    .select("id, starts_at, image_url, category, location, title, description, hide_on_homepage")
    .gte("starts_at", startOfToday)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AgendaItem[];
});

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  starts_at: z.string().min(1),
  image_url: z.string().max(1000).nullable(),
  category: z.enum(["concert", "educatie", "optreden"]),
  location: z.string().max(200).nullable(),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).nullable(),
  hide_on_homepage: z.boolean(),
});

export const upsertAgendaItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: canEdit, error: roleErr } = await supabaseAdmin.rpc("is_content_editor", { _user_id: userId });
    if (roleErr) throw roleErr;
    if (!canEdit) throw new Error("Geen rechten.");

    const row = {
      starts_at: new Date(data.starts_at).toISOString(),
      image_url: data.image_url,
      category: data.category,
      location: data.location,
      title: data.title,
      description: data.description,
      hide_on_homepage: data.hide_on_homepage,
    };

    if (data.id) {
      const { error } = await supabaseAdmin.from("agenda_items").update(row).eq("id", data.id);
      if (error) throw error;
      return { ok: true, id: data.id };
    }
    const { data: inserted, error } = await supabaseAdmin
      .from("agenda_items")
      .insert({ ...row, created_by: userId })
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: inserted.id };
  });

export const deleteAgendaItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: canEdit, error: roleErr } = await supabaseAdmin.rpc("is_content_editor", { _user_id: userId });
    if (roleErr) throw roleErr;
    if (!canEdit) throw new Error("Geen rechten.");

    const { error } = await supabaseAdmin.from("agenda_items").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
