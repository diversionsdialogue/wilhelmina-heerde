import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const ListSchema = z.object({
  page: z.number().int().min(1).max(10000).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
});

export const listContactSubmissions = createServerFn({ method: "POST" })
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
      .from("contact_submissions")
      .select(
        "id, created_at, first_name, last_name, email, phone, message, forwarded_to_n8n, n8n_error",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      rows: rows ?? [],
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
    };
  });

export const listNewsletterSubscribers = createServerFn({ method: "POST" })
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
      .from("newsletter_subscribers")
      .select(
        "id, created_at, email, source, brevo_synced, brevo_error",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      rows: rows ?? [],
      total: count ?? 0,
      page: data.page,
      pageSize: data.pageSize,
    };
  });
