import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AlbumStatus = "draft" | "published";

export type AlbumAdminRow = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string | null;
  excerpt: string | null;
  body_md: string | null;
  cover_image_url: string | null;
  youtube_url: string | null;
  status: AlbumStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  photo_count: number;
};

export type AlbumPhotoInput = {
  id?: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
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

export const listAlbums = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertEditor(context.userId);
    const { data, error } = await supabaseAdmin
      .from("media_albums")
      .select("id, slug, title, eyebrow, excerpt, body_md, cover_image_url, youtube_url, status, published_at, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    const albums = (data ?? []) as Omit<AlbumAdminRow, "photo_count">[];
    if (albums.length === 0) return [] as AlbumAdminRow[];

    const { data: counts, error: cErr } = await supabaseAdmin
      .from("media_album_photos")
      .select("album_id")
      .in("album_id", albums.map((a) => a.id));
    if (cErr) throw cErr;
    const map = new Map<string, number>();
    for (const row of counts ?? []) {
      const key = (row as { album_id: string }).album_id;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return albums.map((a) => ({ ...a, photo_count: map.get(a.id) ?? 0 })) as AlbumAdminRow[];
  });

export const getAlbumAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);
    const { data: album, error } = await supabaseAdmin
      .from("media_albums")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!album) throw new Error("Album niet gevonden.");
    const { data: photos, error: pErr } = await supabaseAdmin
      .from("media_album_photos")
      .select("*")
      .eq("album_id", data.id)
      .order("sort_order", { ascending: true });
    if (pErr) throw pErr;
    return { album, photos: photos ?? [] };
  });

const PhotoSchema = z.object({
  id: z.string().uuid().optional(),
  image_url: z.string().url().max(2048),
  caption: z.string().max(500).nullable().optional(),
  sort_order: z.number().int().min(0).max(10000),
});

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(120).optional().nullable(),
  title: z.string().min(1).max(200),
  eyebrow: z.string().max(120).nullable().optional(),
  excerpt: z.string().max(500).nullable().optional(),
  body_md: z.string().max(200_000).nullable().optional(),
  cover_image_url: z.string().url().max(2048).nullable().optional(),
  youtube_url: z.string().url().max(2048).nullable().optional(),
  status: z.enum(["draft", "published"]),
  published_at: z.string().datetime().nullable().optional(),
  photos: z.array(PhotoSchema).max(500),
});

export const upsertAlbum = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UpsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);

    let slug = (data.slug ?? "").trim();
    if (!slug) slug = slugify(data.title);
    if (!slug) throw new Error("Geen slug of titel.");

    const dupQ = supabaseAdmin.from("media_albums").select("id").eq("slug", slug).limit(1);
    const dup = data.id ? await dupQ.neq("id", data.id).maybeSingle() : await dupQ.maybeSingle();
    if (dup.error) throw dup.error;
    if (dup.data) throw new Error(`Slug "${slug}" bestaat al.`);

    const basePayload = {
      slug,
      title: data.title.trim(),
      eyebrow: data.eyebrow?.trim() || null,
      excerpt: data.excerpt?.trim() || null,
      body_md: data.body_md ?? null,
      cover_image_url: data.cover_image_url || null,
      youtube_url: data.youtube_url || null,
      status: data.status,
    };

    let albumId: string;
    if (data.id) {
      const cur = await supabaseAdmin
        .from("media_albums")
        .select("published_at")
        .eq("id", data.id)
        .maybeSingle();
      if (cur.error) throw cur.error;
      const publishedAt =
        data.status === "published"
          ? (data.published_at ?? cur.data?.published_at ?? new Date().toISOString())
          : null;
      const upd = await supabaseAdmin
        .from("media_albums")
        .update({ ...basePayload, published_at: publishedAt })
        .eq("id", data.id)
        .select("id")
        .single();
      if (upd.error) throw upd.error;
      albumId = upd.data.id;
    } else {
      const publishedAt =
        data.status === "published" ? (data.published_at ?? new Date().toISOString()) : null;
      const ins = await supabaseAdmin
        .from("media_albums")
        .insert({ ...basePayload, published_at: publishedAt, author_id: context.userId })
        .select("id")
        .single();
      if (ins.error) throw ins.error;
      albumId = ins.data.id;
    }

    // Replace photos: delete all then insert
    const delPhotos = await supabaseAdmin
      .from("media_album_photos")
      .delete()
      .eq("album_id", albumId);
    if (delPhotos.error) throw delPhotos.error;

    if (data.photos.length > 0) {
      const rows = data.photos.map((p, i) => ({
        album_id: albumId,
        image_url: p.image_url,
        caption: p.caption?.trim() || null,
        sort_order: i,
      }));
      const insP = await supabaseAdmin.from("media_album_photos").insert(rows);
      if (insP.error) throw insP.error;
    }

    return { id: albumId, slug };
  });

export const deleteAlbum = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);
    const { error } = await supabaseAdmin.from("media_albums").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
