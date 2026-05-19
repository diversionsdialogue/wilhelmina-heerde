import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type HeroPayload = {
  eyebrow: string;
  title: string;
  subtitle: string;
  text: string;
  primary_label: string;
  primary_href: string;
  secondary_label: string;
  secondary_href: string;
};

export type BannerPayload = {
  title: string;
  text: string;
  button_label: string;
  button_href: string;
  image_url: string;
};

export type MenuBannerPayload = {
  image_url: string;
  title: string;
  cta_label: string;
  href: string;
};

const HERO_DEFAULTS: HeroPayload = {
  eyebrow: "Koninklijk Fanfarekorps Wilhelmina",
  title: "Seizoen 2026",
  subtitle: "Verstilling & vuur",
  text: "Drie orkesten, twaalf concerten en een nieuwe compositie van huiscomponist Anouk Veldman — een seizoen tussen ingetogen kamermuziek en groot fanfaregeluid.",
  primary_label: "Concertagenda",
  primary_href: "/optredens",
  secondary_label: "Bekijk de series",
  secondary_href: "/nieuws",
};

const BANNER_DEFAULTS: BannerPayload = {
  title: "Programmaboek 26/27",
  text: "Een bijzondere kennismaking met het seizoen — dirigent, musici en het volledige programma van fanfareorkest, slagwerkensemble en opleidingsorkest.",
  button_label: "Bekijk de concerten",
  button_href: "/optredens",
  image_url: "",
};

/** Publiek leesbare home-content. Wordt zowel door de site als de admin gebruikt. */
export const getHomeSections = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("home_sections")
    .select("key, payload")
    .in("key", ["hero", "banner"]);
  if (error) throw error;

  const map = new Map((data ?? []).map((r) => [r.key, r.payload as Record<string, unknown>]));
  return {
    hero: { ...HERO_DEFAULTS, ...(map.get("hero") as Partial<HeroPayload> | undefined) } as HeroPayload,
    banner: { ...BANNER_DEFAULTS, ...(map.get("banner") as Partial<BannerPayload> | undefined) } as BannerPayload,
  };
});

const HeroSchema = z.object({
  eyebrow: z.string().max(200),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(200),
  text: z.string().max(1000),
  primary_label: z.string().max(80),
  primary_href: z.string().max(500),
  secondary_label: z.string().max(80),
  secondary_href: z.string().max(500),
});

const BannerSchema = z.object({
  title: z.string().min(1).max(200),
  text: z.string().max(1000),
  button_label: z.string().max(80),
  button_href: z.string().max(500),
  image_url: z.string().max(1000).default(""),
});

const InputSchema = z.union([
  z.object({ key: z.literal("hero"), payload: HeroSchema }),
  z.object({ key: z.literal("banner"), payload: BannerSchema }),
]);

export const updateHomeSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Role-check via security-definer functie
    const { data: canEdit, error: roleErr } = await supabaseAdmin.rpc("is_content_editor", { _user_id: userId });
    if (roleErr) throw roleErr;
    if (!canEdit) throw new Error("Geen rechten om home-content te wijzigen.");

    const { error } = await supabaseAdmin
      .from("home_sections")
      .upsert({ key: data.key, payload: data.payload, updated_by: userId }, { onConflict: "key" });
    if (error) throw error;
    return { ok: true };
  });
