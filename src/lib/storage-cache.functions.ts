import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKETS = [
  "sponsor-logos",
  "menu-media",
  "agenda-media",
  "news-media",
  "page-media",
  "gallery-media",
] as const;

const TARGET_CACHE = "31536000"; // 1 year

type Result = {
  bucket: string;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
};

async function listAll(
  supabaseAdmin: any,
  bucket: string,
  prefix = "",
): Promise<{ path: string; cacheControl: string | null; mimetype: string | null }[]> {
  const out: { path: string; cacheControl: string | null; mimetype: string | null }[] = [];
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .list(prefix, { limit: 1000, sortBy: { column: "name", order: "asc" } });
  if (error) throw error;
  for (const entry of data ?? []) {
    const full = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (!entry.id) {
      const nested = await listAll(supabaseAdmin, bucket, full);
      out.push(...nested);
      continue;
    }
    const meta = (entry.metadata ?? {}) as Record<string, unknown>;
    const cc =
      typeof meta.cacheControl === "string"
        ? (meta.cacheControl as string)
        : typeof (meta as any).cache_control === "string"
          ? ((meta as any).cache_control as string)
          : null;
    const mt = typeof meta.mimetype === "string" ? (meta.mimetype as string) : null;
    out.push({ path: full, cacheControl: cc, mimetype: mt });
  }
  return out;
}

export const refreshStorageCacheHeaders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw roleErr;
    if (!isAdmin) throw new Error("Forbidden");

    const results: Result[] = [];

    for (const bucket of BUCKETS) {
      const r: Result = { bucket, updated: 0, skipped: 0, failed: 0, errors: [] };
      try {
        const files = await listAll(supabaseAdmin, bucket);
        for (const f of files) {
          // Skip if already long-cached (max-age >= 1 day → assume good)
          const m = f.cacheControl?.match(/max-age=(\d+)/);
          if (m && Number(m[1]) >= 86400) {
            r.skipped++;
            continue;
          }
          try {
            const { data: blob, error: dlErr } = await supabaseAdmin.storage
              .from(bucket)
              .download(f.path);
            if (dlErr || !blob) throw dlErr ?? new Error("download failed");
            const buf = new Uint8Array(await blob.arrayBuffer());
            const { error: upErr } = await supabaseAdmin.storage.from(bucket).upload(f.path, buf, {
              upsert: true,
              contentType: f.mimetype ?? blob.type ?? "application/octet-stream",
              cacheControl: TARGET_CACHE,
            });
            if (upErr) throw upErr;
            r.updated++;
          } catch (e) {
            r.failed++;
            r.errors.push(`${f.path}: ${(e as Error).message}`);
          }
        }
      } catch (e) {
        r.errors.push(`bucket: ${(e as Error).message}`);
      }
      results.push(r);
    }

    return { results };
  });
