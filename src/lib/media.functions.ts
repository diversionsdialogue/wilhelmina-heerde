import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const MEDIA_BUCKETS = [
  "news-media",
  "page-media",
  "agenda-media",
  "menu-media",
  "sponsor-logos",
] as const;
export type MediaBucket = (typeof MEDIA_BUCKETS)[number];

export type MediaFile = {
  bucket: MediaBucket;
  path: string; // full path within bucket
  name: string; // basename
  size: number | null;
  mimetype: string | null;
  updated_at: string | null;
  created_at: string | null;
  publicUrl: string;
};

async function assertEditor(userId: string) {
  const { data, error } = await supabaseAdmin.rpc("is_content_editor", { _user_id: userId });
  if (error) throw error;
  if (!data) throw new Error("Geen rechten.");
}

async function listBucketRecursive(bucket: MediaBucket, prefix = ""): Promise<MediaFile[]> {
  const out: MediaFile[] = [];
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .list(prefix, { limit: 1000, sortBy: { column: "updated_at", order: "desc" } });
  if (error) throw error;
  for (const entry of data ?? []) {
    const full = prefix ? `${prefix}/${entry.name}` : entry.name;
    // Folders have null id (in supabase-js) — recurse
    if (!entry.id) {
      const nested = await listBucketRecursive(bucket, full);
      out.push(...nested);
      continue;
    }
    const meta = (entry.metadata ?? {}) as Record<string, unknown>;
    const { data: pub } = supabaseAdmin.storage.from(bucket).getPublicUrl(full);
    out.push({
      bucket,
      path: full,
      name: entry.name,
      size: typeof meta.size === "number" ? meta.size : null,
      mimetype: typeof meta.mimetype === "string" ? meta.mimetype : null,
      updated_at: entry.updated_at ?? null,
      created_at: entry.created_at ?? null,
      publicUrl: pub.publicUrl,
    });
  }
  return out;
}

export const listMedia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertEditor(context.userId);
    const all: MediaFile[] = [];
    for (const bucket of MEDIA_BUCKETS) {
      try {
        const files = await listBucketRecursive(bucket);
        all.push(...files);
      } catch (e) {
        console.error(`listMedia: bucket ${bucket} failed`, e);
      }
    }
    all.sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""));
    return all;
  });

const DeleteSchema = z.object({
  bucket: z.enum(MEDIA_BUCKETS),
  path: z.string().min(1).max(1024),
});

export const deleteMediaFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => DeleteSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);
    const { error } = await supabaseAdmin.storage.from(data.bucket).remove([data.path]);
    if (error) throw error;
    return { ok: true };
  });
