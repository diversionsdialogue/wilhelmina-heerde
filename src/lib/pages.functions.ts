import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PageStatus = "draft" | "published";

export type PageRow = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string | null;
  excerpt: string | null;
  body_md: string | null;
  cover_image_url: string | null;
  status: PageStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function assertEditor(userId: string) {
  const { data, error } = await supabaseAdmin.rpc("is_content_editor", { _user_id: userId });
  if (error) throw error;
  if (!data) throw new Error("Geen rechten.");
}

export const listPages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertEditor(context.userId);
    const { data, error } = await supabaseAdmin
      .from("pages")
      .select("id, slug, title, eyebrow, excerpt, body_md, cover_image_url, status, published_at, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    return (data ?? []) as PageRow[];
  });

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120).optional().nullable(),
  title: z.string().min(1).max(200),
  eyebrow: z.string().max(120).nullable().optional(),
  excerpt: z.string().max(500).nullable().optional(),
  body_md: z.string().max(200_000).nullable().optional(),
  cover_image_url: z.string().url().max(2048).nullable().optional(),
  status: z.enum(["draft", "published"]),
});

export const upsertPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);

    let slug = (data.slug ?? "").trim();
    if (!slug) slug = slugify(data.title);
    if (!slug) throw new Error("Geen slug of titel.");

    // Slug-uniciteit checken (alleen voor andere rijen)
    const dupQ = supabaseAdmin.from("pages").select("id").eq("slug", slug).limit(1);
    const dup = data.id ? await dupQ.neq("id", data.id).maybeSingle() : await dupQ.maybeSingle();
    if (dup.error) throw dup.error;
    if (dup.data) throw new Error(`Slug "${slug}" bestaat al.`);

    const payload = {
      slug,
      title: data.title.trim(),
      eyebrow: data.eyebrow?.trim() || null,
      excerpt: data.excerpt?.trim() || null,
      body_md: data.body_md ?? null,
      cover_image_url: data.cover_image_url || null,
      status: data.status,
      published_at:
        data.status === "published" ? new Date().toISOString() : null,
    };

    if (data.id) {
      // Bij een update: published_at alleen zetten als hij nog null was
      const cur = await supabaseAdmin.from("pages").select("published_at, status").eq("id", data.id).maybeSingle();
      if (cur.error) throw cur.error;
      const keepPublishedAt =
        cur.data?.status === "published" && cur.data.published_at ? cur.data.published_at : payload.published_at;
      const upd = await supabaseAdmin
        .from("pages")
        .update({ ...payload, published_at: keepPublishedAt })
        .eq("id", data.id)
        .select("id")
        .single();
      if (upd.error) throw upd.error;
      return { id: upd.data.id, slug };
    }

    const ins = await supabaseAdmin
      .from("pages")
      .insert({ ...payload, author_id: context.userId })
      .select("id")
      .single();
    if (ins.error) throw ins.error;
    return { id: ins.data.id, slug };
  });

export const deletePage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);
    const { error } = await supabaseAdmin.from("pages").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
