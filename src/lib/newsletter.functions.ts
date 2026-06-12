import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BREVO_LIST_ID = 3;
const BREVO_GATEWAY_URL = "https://connector-gateway.lovable.dev/brevo";

const Schema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  source: z.string().trim().max(100).optional().nullable(),
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input) => Schema.parse(input))
  .handler(async ({ data }) => {
    const userAgent = getRequestHeader("user-agent") ?? null;
    let ip: string | null = null;
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? null;
    } catch {
      ip = null;
    }

    // Upsert in eigen DB (uniek op lower(email))
    const { data: row, error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .upsert(
        {
          email: data.email,
          source: data.source ?? null,
          user_agent: userAgent,
          ip,
          brevo_synced: false,
          brevo_error: null,
        },
        { onConflict: "email" },
      )
      .select("id")
      .single();

    if (error || !row) {
      throw new Error(error?.message ?? "Kon aanmelding niet opslaan");
    }

    // Brevo via Lovable connector-gateway
    const lovableKey = process.env.LOVABLE_API_KEY;
    const brevoKey = process.env.BREVO_API_KEY;

    if (!lovableKey || !brevoKey) {
      await supabaseAdmin
        .from("newsletter_subscribers")
        .update({ brevo_error: "Brevo niet geconfigureerd (ontbrekende sleutels)" })
        .eq("id", row.id);
      return { ok: true as const };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(`${BREVO_GATEWAY_URL}/contacts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": brevoKey,
        },
        body: JSON.stringify({
          email: data.email,
          listIds: [BREVO_LIST_ID],
          updateEnabled: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        await supabaseAdmin
          .from("newsletter_subscribers")
          .update({ brevo_error: `HTTP ${res.status}: ${body.slice(0, 500)}` })
          .eq("id", row.id);
      } else {
        await supabaseAdmin
          .from("newsletter_subscribers")
          .update({ brevo_synced: true, brevo_error: null })
          .eq("id", row.id);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await supabaseAdmin
        .from("newsletter_subscribers")
        .update({ brevo_error: msg.slice(0, 500) })
        .eq("id", row.id);
    } finally {
      clearTimeout(timeout);
    }

    return { ok: true as const };
  });
