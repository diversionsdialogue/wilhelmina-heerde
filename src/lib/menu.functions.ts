import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createPublicSupabase } from "./supabase-public.server";

export type MenuBannerPayload = {
  image_url: string;
  title: string;
  cta_label: string;
  href: string;
};

const DEFAULTS: MenuBannerPayload = {
  image_url: "",
  title: "Zelf muziek maken",
  cta_label: "Start direct",
  href: "/orkesten",
};

export const getMenuBanner = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await createPublicSupabase()
    .from("home_sections")
    .select("payload")
    .eq("key", "menu_banner")
    .maybeSingle();
  if (error) throw error;
  return {
    ...DEFAULTS,
    ...((data?.payload ?? {}) as Partial<MenuBannerPayload>),
  } as MenuBannerPayload;
});

const Schema = z.object({
  image_url: z.string().max(1000),
  title: z.string().min(1).max(200),
  cta_label: z.string().max(80),
  href: z.string().max(500),
});

export const updateMenuBanner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => Schema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: canEdit, error: roleErr } = await supabaseAdmin.rpc("is_content_editor", { _user_id: userId });
    if (roleErr) throw roleErr;
    if (!canEdit) throw new Error("Geen rechten om de menu-banner te wijzigen.");

    const { error } = await supabaseAdmin
      .from("home_sections")
      .upsert({ key: "menu_banner", payload: data, updated_by: userId }, { onConflict: "key" });
    if (error) throw error;
    return { ok: true };
  });
