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

const SAFE_NAME = /^[a-zA-Z0-9._-]+$/;

const RenameSchema = z.object({
  bucket: z.enum(MEDIA_BUCKETS),
  path: z.string().min(1).max(1024),
  newName: z.string().min(1).max(255).regex(SAFE_NAME, "Alleen letters, cijfers, . _ - toegestaan"),
});

export const renameMediaFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => RenameSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);
    const dir = data.path.includes("/") ? data.path.slice(0, data.path.lastIndexOf("/")) : "";
    const newPath = dir ? `${dir}/${data.newName}` : data.newName;
    if (newPath === data.path) return { ok: true, path: newPath };
    const { error } = await supabaseAdmin.storage.from(data.bucket).move(data.path, newPath);
    if (error) throw error;
    return { ok: true, path: newPath };
  });

const UploadSchema = z.object({
  bucket: z.enum(MEDIA_BUCKETS),
  name: z.string().min(1).max(255).regex(SAFE_NAME, "Alleen letters, cijfers, . _ - toegestaan"),
  prefix: z.string().max(512).regex(/^[a-zA-Z0-9._/-]*$/).optional().default(""),
  contentType: z.string().min(1).max(100),
  dataBase64: z.string().min(1).max(20 * 1024 * 1024),
  upsert: z.boolean().default(false),
});

export const uploadMediaFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => UploadSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);
    const prefix = (data.prefix ?? "").replace(/^\/+|\/+$/g, "");
    const path = prefix ? `${prefix}/${data.name}` : data.name;
    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    const { error } = await supabaseAdmin.storage
      .from(data.bucket)
      .upload(path, bytes, { contentType: data.contentType, upsert: data.upsert });
    if (error) throw error;
    const { data: pub } = supabaseAdmin.storage.from(data.bucket).getPublicUrl(path);
    return { ok: true, path, publicUrl: pub.publicUrl };
  });

const ReplaceSchema = z.object({
  bucket: z.enum(MEDIA_BUCKETS),
  path: z.string().min(1).max(1024),
  newName: z.string().min(1).max(255).regex(SAFE_NAME),
  contentType: z.string().min(1).max(100),
  dataBase64: z.string().min(1).max(20 * 1024 * 1024), // ~15 MB binary
  deleteOriginal: z.boolean().default(true),
});

export const replaceMediaFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ReplaceSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertEditor(context.userId);
    const dir = data.path.includes("/") ? data.path.slice(0, data.path.lastIndexOf("/")) : "";
    const newPath = dir ? `${dir}/${data.newName}` : data.newName;
    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    const { error: upErr } = await supabaseAdmin.storage
      .from(data.bucket)
      .upload(newPath, bytes, { contentType: data.contentType, upsert: true });
    if (upErr) throw upErr;
    if (data.deleteOriginal && newPath !== data.path) {
      const { error: delErr } = await supabaseAdmin.storage.from(data.bucket).remove([data.path]);
      if (delErr) throw delErr;
    }
    return { ok: true, path: newPath };
  });
