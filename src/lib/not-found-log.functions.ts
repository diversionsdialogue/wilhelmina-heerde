import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PathSchema = z.object({
  path: z.string().min(1).max(2048),
});

/**
 * Upsert een 404-hit in `not_found_log`. Wordt server-side aangeroepen
 * vanuit de catch-all route. Referrer en user-agent worden uit de request
 * gehaald — niet uit user-input.
 */
export const logNotFound = createServerFn({ method: "POST" })
  .inputValidator((input) => PathSchema.parse(input))
  .handler(async ({ data }) => {
    const referrer = getRequestHeader("referer") ?? null;
    const userAgent = getRequestHeader("user-agent") ?? null;

    const path = data.path.slice(0, 2048);

    // Probeer eerst hit_count + 1 (bestaande rij)
    const { data: existing } = await supabaseAdmin
      .from("not_found_log")
      .select("id, hit_count")
      .eq("path", path)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("not_found_log")
        .update({
          hit_count: existing.hit_count + 1,
          last_seen_at: new Date().toISOString(),
          last_referrer: referrer,
          last_user_agent: userAgent,
        })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin.from("not_found_log").insert({
        path,
        hit_count: 1,
        last_referrer: referrer,
        last_user_agent: userAgent,
      });
    }

    return { ok: true };
  });

const ListSchema = z.object({
  page: z.number().int().min(1).max(10000).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
});

export const listNotFoundLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ListSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isEditor } = await context.supabase.rpc("is_content_editor", {
      _user_id: context.userId,
    });
    if (!isEditor) throw new Error("Forbidden");

    const from = (data.page - 1) * data.pageSize;
    const to = from + data.pageSize - 1;

    const { data: rows, count, error } = await supabaseAdmin
      .from("not_found_log")
      .select("id, path, hit_count, last_referrer, last_user_agent, first_seen_at, last_seen_at", {
        count: "exact",
      })
      .order("hit_count", { ascending: false })
      .order("last_seen_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      rows: rows ?? [],
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

const DeleteSchema = z.object({ id: z.string().uuid() });

export const deleteNotFoundEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => DeleteSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isEditor } = await context.supabase.rpc("is_content_editor", {
      _user_id: context.userId,
    });
    if (!isEditor) throw new Error("Forbidden");

    const { error } = await supabaseAdmin.from("not_found_log").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const clearNotFoundLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isEditor } = await context.supabase.rpc("is_content_editor", {
      _user_id: context.userId,
    });
    if (!isEditor) throw new Error("Forbidden");

    const { error } = await supabaseAdmin
      .from("not_found_log")
      .delete()
      .gte("hit_count", 0); // alles
    if (error) throw error;
    return { ok: true };
  });
