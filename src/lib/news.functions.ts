import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import matter from "gray-matter";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const BUCKET = "news-media";

const FileSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.string().max(100).optional(),
  /** base64-encoded contents (without data: prefix). For .md files this is utf-8 text encoded as base64. */
  base64: z.string().min(1),
});

const ImportSchema = z.object({
  files: z.array(FileSchema).min(1).max(200),
});

type InputFile = z.infer<typeof FileSchema>;

type ImportResult = {
  file: string;
  status: "imported" | "skipped" | "error";
  slug?: string;
  reason?: string;
};

const IMG_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;
const IMG_REF_RE = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function decodeBase64ToBuffer(b64: string): Uint8Array {
  // Worker-safe base64 decode.
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function decodeBase64ToString(b64: string): string {
  const bytes = decodeBase64ToBuffer(b64);
  return new TextDecoder("utf-8").decode(bytes);
}

function contentTypeFromName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".avif")) return "image/avif";
  return "application/octet-stream";
}

function baseName(p: string): string {
  return p.split("/").pop()?.split("\\").pop() ?? p;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function excerptFromBody(md: string, max = 180): string {
  const plain = md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_`~-]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length <= max) return plain;
  return plain.slice(0, max).replace(/\s+\S*$/, "") + "…";
}

export const importNewsBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => ImportSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: canEdit, error: roleErr } = await supabaseAdmin.rpc("is_content_editor", { _user_id: userId });
    if (roleErr) throw roleErr;
    if (!canEdit) throw new Error("Geen rechten.");

    // Index alle bijgeleverde afbeeldingen op basisnaam (case-insensitive).
    const imageMap = new Map<string, InputFile>();
    for (const f of data.files) {
      if (IMG_EXT.test(f.name)) {
        imageMap.set(baseName(f.name).toLowerCase(), f);
      }
    }

    const mdFiles = data.files.filter((f) => f.name.toLowerCase().endsWith(".md"));
    const results: ImportResult[] = [];

    for (const md of mdFiles) {
      try {
        const raw = decodeBase64ToString(md.base64);
        const parsed = matter(raw);
        const fm = parsed.data as Record<string, unknown>;
        const title = String(fm.title ?? "").trim();
        let slug = String(fm.slug ?? "").trim();
        if (!slug && title) slug = slugify(title);
        if (!slug) {
          results.push({ file: md.name, status: "error", reason: "Geen slug of titel" });
          continue;
        }
        if (!title) {
          results.push({ file: md.name, status: "error", reason: "Geen titel in frontmatter", slug });
          continue;
        }

        // Bestaat slug al? → overslaan.
        const existing = await supabaseAdmin
          .from("news")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (existing.error) throw existing.error;
        if (existing.data) {
          results.push({ file: md.name, status: "skipped", slug, reason: "Slug bestaat al" });
          continue;
        }

        // Verwerk afbeeldingen in de body.
        let body = parsed.content.trim();
        const uploaded = new Map<string, string>(); // origineel pad → publieke URL
        let coverUrl: string | null = null;
        let coverRefMd: string | null = null; // markdown van de eerste image, zodat we hem weghalen uit body
        let firstSeen = false;

        const matches = Array.from(body.matchAll(IMG_REF_RE));
        for (const m of matches) {
          const ref = m[2];
          if (/^https?:\/\//i.test(ref) || ref.startsWith("/")) continue; // alleen relatief
          if (uploaded.has(ref)) continue;
          const key = baseName(ref).toLowerCase();
          const imgFile = imageMap.get(key);
          if (!imgFile) {
            results.push({ file: md.name, status: "error", slug, reason: `Afbeelding ontbreekt: ${ref}` });
            uploaded.set(ref, ""); // markeer als afgehandeld om dubbele errors te voorkomen
            continue;
          }
          const path = `${slug}/${baseName(ref)}`;
          const bytes = decodeBase64ToBuffer(imgFile.base64);
          const up = await supabaseAdmin.storage
            .from(BUCKET)
            .upload(path, bytes, {
              contentType: contentTypeFromName(imgFile.name),
              upsert: true,
            });
          if (up.error) throw up.error;
          const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
          uploaded.set(ref, pub.publicUrl);
          if (!firstSeen) {
            firstSeen = true;
            coverUrl = pub.publicUrl;
            coverRefMd = m[0]; // hele ![..](..) string
          }
        }

        // Stop als er een ontbrekende afbeelding was.
        if (results.some((r) => r.file === md.name && r.status === "error")) continue;

        // Vervang relatieve refs door publieke URLs.
        body = body.replace(IMG_REF_RE, (full, alt, ref) => {
          const url = uploaded.get(ref);
          if (!url) return full;
          return `![${alt}](${url})`;
        });
        // Haal de cover-afbeelding uit de body (eerste image-ref, na vervanging).
        if (coverRefMd && coverUrl) {
          const replacedCover = coverRefMd.replace(IMG_REF_RE, (_full, alt, ref) => {
            const url = uploaded.get(ref) ?? ref;
            return `![${alt}](${url})`;
          });
          body = body.replace(replacedCover, "").replace(/^\s*\n+/, "");
        }

        const publishedAt = fm.date ? new Date(String(fm.date)).toISOString() : new Date().toISOString();
        const eyebrow = fm.eyebrow ? String(fm.eyebrow).trim() : null;
        const excerpt = fm.excerpt ? String(fm.excerpt).trim() : excerptFromBody(body);

        const ins = await supabaseAdmin.from("news").insert({
          slug,
          title,
          eyebrow,
          excerpt,
          body_md: body,
          cover_image_url: coverUrl,
          status: "published",
          published_at: publishedAt,
          author_id: userId,
        });
        if (ins.error) throw ins.error;

        results.push({ file: md.name, status: "imported", slug });
      } catch (err) {
        results.push({
          file: md.name,
          status: "error",
          reason: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { results };
  });
