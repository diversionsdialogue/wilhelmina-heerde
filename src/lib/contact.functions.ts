import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const N8N_WEBHOOK_URL =
  "https://diversions-connect-u67534.vm.elestio.app/webhook/c952ba94-63c9-4b88-81ac-d1858f2d545b";

const Schema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(50).optional().nullable(),
  message: z.string().trim().min(1).max(4000),
  consent: z.literal(true),
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((input) => Schema.parse(input))
  .handler(async ({ data }) => {
    const userAgent = getRequestHeader("user-agent") ?? null;
    let ip: string | null = null;
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? null;
    } catch {
      ip = null;
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
