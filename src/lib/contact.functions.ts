import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const N8N_WEBHOOK_URL =
  "https://diversions-connect-u67534.vm.elestio.app/webhook/c952ba94-63c9-4b88-81ac-d1858f2d545b";

const MIN_FILL_MS = 2_000; // bots versturen instant
const MAX_FILL_MS = 6 * 60 * 60 * 1000; // 6u — verlopen sessies weren
const RATE_LIMIT_PER_HOUR = 3;
const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000;

const Schema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(50).optional().nullable(),
  message: z.string().trim().min(1).max(4000),
  consent: z.literal(true),
  // anti-spam (client-meegegeven)
  website: z.string().max(0).optional().nullable(), // honeypot — moet leeg zijn
  started_at: z.number().int().positive(),
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((input) => Schema.parse(input))
  .handler(async ({ data }) => {
    // 1) Honeypot
    if (data.website && data.website.length > 0) {
      // Stilletjes "ok" teruggeven om bots geen feedback te geven
      return { ok: true as const };
    }

    // 2) Min-time check
    const elapsed = Date.now() - data.started_at;
    if (elapsed < MIN_FILL_MS || elapsed > MAX_FILL_MS) {
      return { ok: true as const };
    }

    const userAgent = getRequestHeader("user-agent") ?? null;
    let ip: string | null = null;
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? null;
    } catch {
      ip = null;
    }

    // 3) Rate limit per IP (laatste uur)
    if (ip) {
      const sinceIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabaseAdmin
        .from("contact_submissions")
        .select("id", { count: "exact", head: true })
        .eq("ip", ip)
        .gte("created_at", sinceIso);
      if ((count ?? 0) >= RATE_LIMIT_PER_HOUR) {
        throw new Error(
          "Je hebt recent al een bericht verstuurd. Wacht even voordat je opnieuw probeert.",
        );
      }
    }

    // 4) Deduplicatie — zelfde email + bericht in laatste 24u
    const dedupSince = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString();
    const { data: dup } = await supabaseAdmin
      .from("contact_submissions")
      .select("id")
      .eq("email", data.email)
      .eq("message", data.message)
      .gte("created_at", dedupSince)
      .limit(1)
      .maybeSingle();
    if (dup) {
      return { ok: true as const };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("contact_submissions")
      .insert({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone?.trim() || null,
        message: data.message,
        consent: data.consent,
        user_agent: userAgent,
        ip,
      })
      .select("id, created_at")
      .single();

    if (error || !inserted) {
      throw new Error(error?.message ?? "Kon inzending niet opslaan");
    }

    // Forward to n8n webhook (best-effort; submission is already saved)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const webhookSecret = process.env.N8N_CONTACT_WEBHOOK_SECRET ?? "";
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(webhookSecret
            ? {
                "X-Webhook-Secret": webhookSecret,
                Authorization: `Bearer ${webhookSecret}`,
              }
            : {}),
        },
        body: JSON.stringify({
          submission_id: inserted.id,
          created_at: inserted.created_at,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone?.trim() || null,
          message: data.message,
          consent: data.consent,
        }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        await supabaseAdmin
          .from("contact_submissions")
          .update({ n8n_error: `HTTP ${res.status}: ${body.slice(0, 500)}` })
          .eq("id", inserted.id);
      } else {
        await supabaseAdmin
          .from("contact_submissions")
          .update({ forwarded_to_n8n: true })
          .eq("id", inserted.id);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await supabaseAdmin
        .from("contact_submissions")
        .update({ n8n_error: msg.slice(0, 500) })
        .eq("id", inserted.id);
    } finally {
      clearTimeout(timeout);
    }

    return { ok: true as const };
  });
