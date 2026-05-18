/**
 * Clean Visual Composer / Salient shortcodes uit pages + news.
 *
 * Gebruik:
 *   bun scripts/clean-shortcodes.ts            # dry-run (preview)
 *   bun scripts/clean-shortcodes.ts --apply    # schrijft wijzigingen weg
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const APPLY = process.argv.includes("--apply");

const admin = createClient(url, key, { auth: { persistSession: false } });

/** Bekende shortcode-namen (open + sluit, met of zonder attributen). */
const SHORTCODE_NAMES = [
  "vc_row", "vc_column", "vc_column_text", "vc_row_inner", "vc_column_inner",
  "vc_separator", "vc_single_image", "vc_btn", "vc_video", "vc_raw_html",
  "vc_custom_heading", "vc_gallery", "vc_message", "vc_tta_section", "vc_tta_tabs",
  "vc_tta_accordion", "vc_empty_space",
  "nectar_btn", "nectar_slider", "nectar_highlighted_text", "nectar_cta",
  "nectar_icon", "nectar_image_comparison", "nectar_video_player_self_hosted",
  "nectar_animated_title", "nectar_blog", "nectar_global_section",
  "divider", "team_member", "image_with_animation", "button", "buttons",
  "clients", "client", "info_circle", "info_banner", "contact_form",
  "image_with_aspect_ratio", "fancy_box", "milestone", "icon_list",
  "icon_list_item", "split_line_heading",
];

/** Haal de waarde van attr="…" uit een shortcode-tag. */
function getAttr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i"));
  return m ? m[1].trim() : null;
}

function clean(input: string): string {
  if (!input) return input;
  let s = input;

  // 1) Unescape markdown-escaped chars die uit WP-import komen.
  s = s.replace(/\\([_\[\](){}#*+\-.!|>`~])/g, "$1");
  s = s.replace(/\r\n?/g, "\n");

  // 2) Bewaar inhoud die in attributen is opgeslagen vóór we strippen.
  //    team_member → "- **Naam** — functie"
  s = s.replace(/\[team_member\b[^\]]*\]/gi, (tag) => {
    const name = getAttr(tag, "name");
    const pos = getAttr(tag, "job_position") || getAttr(tag, "position") || getAttr(tag, "title");
    if (!name) return "";
    return `\n- **${name.trim()}**${pos ? ` — ${pos}` : ""}`;
  });

  //    image_with_animation / vc_single_image → ![](url)
  s = s.replace(/\[(?:image_with_animation|vc_single_image)\b[^\]]*\]/gi, (tag) => {
    const url = getAttr(tag, "image_url") || getAttr(tag, "image") || getAttr(tag, "src");
    return url ? `\n\n![](${url})\n\n` : "";
  });

  //    button / nectar_btn / vc_btn → [tekst](url)
  s = s.replace(/\[(?:button|nectar_btn|vc_btn)\b[^\]]*\]/gi, (tag) => {
    const text = getAttr(tag, "text") || getAttr(tag, "title") || "Lees meer";
    const url = getAttr(tag, "url") || getAttr(tag, "link");
    return url ? ` [${text}](${url}) ` : "";
  });

  // 3) Strip alle bekende shortcodes (open, sluit, self-closing, met attrs).
  const namesAlt = SHORTCODE_NAMES.join("|");
  const tag = new RegExp(`\\[\\/?(?:${namesAlt})(?:\\s+[^\\]]*)?\\/?\\]`, "gi");
  s = s.replace(tag, "");

  // 4) Generieke fallback: [foo_bar attr="x"] of [/foo_bar] — mits niet gevolgd
  //    door "(" (anders is het een markdown-link).
  s = s.replace(/\[\/?[a-z][a-z0-9_]*(?:\s+[^\]]*)?\](?!\()/gi, "");

  // 5) Whitespace opschonen.
  s = s.replace(/[ \t]+\n/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s.trim();
}

type Row = { id: string; slug: string; title: string; body_md: string | null };

async function processTable(table: "pages" | "news") {
  const { data, error } = await admin.from(table).select("id, slug, title, body_md");
  if (error) throw error;

  const changes: { id: string; slug: string; title: string; before: number; after: number; body_md: string }[] = [];
  for (const row of (data ?? []) as Row[]) {
    const before = row.body_md ?? "";
    const after = clean(before);
    if (after !== before) {
      changes.push({ id: row.id, slug: row.slug, title: row.title, before: before.length, after: after.length, body_md: after });
    }
  }

  console.log(`\n=== ${table.toUpperCase()} — ${changes.length} wijziging(en) ===`);
  for (const c of changes) {
    console.log(`  • ${c.slug.padEnd(50)} ${c.before} → ${c.after} chars  (${c.title})`);
  }

  if (APPLY && changes.length) {
    for (const c of changes) {
      const { error: upErr } = await admin.from(table).update({ body_md: c.body_md }).eq("id", c.id);
      if (upErr) {
        console.error(`  ✗ ${c.slug}: ${upErr.message}`);
      }
    }
    console.log(`  ✓ ${changes.length} ${table}-rijen bijgewerkt.`);
  }
  return changes.length;
}

async function main() {
  console.log(APPLY ? "Modus: APPLY (schrijft weg)" : "Modus: DRY-RUN (geen wijzigingen)");
  const a = await processTable("pages");
  const b = await processTable("news");
  console.log(`\nTotaal: ${a + b} rij(en) zouden ${APPLY ? "zijn" : "worden"} bijgewerkt.`);
  if (!APPLY) console.log("\nRun met --apply om weg te schrijven.");
}

main().catch((e) => { console.error(e); process.exit(1); });
