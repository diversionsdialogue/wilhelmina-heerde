import { Fragment, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * Splits a markdown body into ordered segments of plain markdown and
 * `::: <name> … :::` blocks (faq, button, cta).
 */
type FaqPair = { q: string; a: string };
type ButtonAttrs = { href: string; label: string; variant: "primary" | "secondary" | "ink" };
type CtaAttrs = { href: string; image: string; button: string; body: string };
type Segment =
  | { type: "md"; content: string }
  | { type: "faq"; items: FaqPair[] }
  | { type: "button"; attrs: ButtonAttrs }
  | { type: "cta"; attrs: CtaAttrs };

const BLOCK_RE = /^:::\s*(faq|button|cta)([^\n]*)\n([\s\S]*?)^:::\s*$/gm;

function parseAttrs(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /(\w+)=("([^"]*)"|'([^']*)'|(\S+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    out[m[1]] = m[3] ?? m[4] ?? m[5] ?? "";
  }
  return out;
}

function parseFaqBlock(inner: string): FaqPair[] {
  const lines = inner.split("\n");
  const pairs: FaqPair[] = [];
  let current: FaqPair | null = null;
  const flush = () => {
    if (current) {
      current.a = current.a.trim();
      if (current.q) pairs.push(current);
      current = null;
    }
  };
  for (const line of lines) {
    const m = /^###\s+(.+?)\s*$/.exec(line);
    if (m) {
      flush();
      current = { q: m[1].trim(), a: "" };
    } else if (current) {
      current.a += line + "\n";
    }
  }
  flush();
  return pairs;
}

export function parseArticleBody(body: string): { segments: Segment[]; faqs: FaqPair[] } {
  const segments: Segment[] = [];
  const faqs: FaqPair[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  BLOCK_RE.lastIndex = 0;
  while ((match = BLOCK_RE.exec(body)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "md", content: body.slice(lastIndex, match.index) });
    }
    const kind = match[1];
    const attrsRaw = match[2] ?? "";
    const inner = match[3] ?? "";
    if (kind === "faq") {
      const items = parseFaqBlock(inner);
      if (items.length) {
        segments.push({ type: "faq", items });
        faqs.push(...items);
      }
    } else if (kind === "button") {
      const a = parseAttrs(attrsRaw);
      const label = (a.label || inner.trim() || "Lees meer").trim();
      const variant = (a.variant === "secondary" || a.variant === "ink" ? a.variant : "primary") as ButtonAttrs["variant"];
      segments.push({ type: "button", attrs: { href: a.href || "#", label, variant } });
    } else if (kind === "cta") {
      const a = parseAttrs(attrsRaw);
      segments.push({
        type: "cta",
        attrs: {
          href: a.href || "#",
          image: a.image || "",
          button: a.button || "Lees meer",
          body: inner.trim(),
        },
      });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < body.length) {
    segments.push({ type: "md", content: body.slice(lastIndex) });
  }
  if (segments.length === 0) segments.push({ type: "md", content: body });
  return { segments, faqs };
}

/** Strip markdown to plain text for JSON-LD answers (keeps links readable). */
function mdToPlain(md: string): string {
  return md
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\n{2,}/g, " ")
    .replace(/\n/g, " ")
    .trim();
}

export function buildFaqJsonLd(faqs: FaqPair[]): string | null {
  if (!faqs.length) return null;
  const payload = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: mdToPlain(f.a) },
    })),
  };
  return JSON.stringify(payload);
}

const mdComponents = {
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <div className="w-article__quote">{children}</div>
  ),
};

function ArticleButton({ attrs }: { attrs: ButtonAttrs }) {
  const cls = `w-btn w-btn--${attrs.variant}`;
  const isExternal = /^https?:\/\//i.test(attrs.href);
  return (
    <p className="w-article__button" style={{ margin: "1.5em 0" }}>
      <a
        href={attrs.href}
        className={cls}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {attrs.label}
      </a>
    </p>
  );
}

function ArticleCta({ attrs }: { attrs: CtaAttrs }) {
  const isExternal = /^https?:\/\//i.test(attrs.href);
  const linkProps = {
    href: attrs.href,
    target: isExternal ? "_blank" : undefined,
    rel: isExternal ? "noopener noreferrer" : undefined,
  };
  return (
    <aside
      className="w-article__cta"
      style={{
        display: "grid",
        gridTemplateColumns: attrs.image ? "minmax(0, 1fr) minmax(0, 1fr)" : "1fr",
        gap: 24,
        alignItems: "stretch",
        margin: "2em 0",
        border: "1px solid var(--w-line, #e8e4dd)",
        borderRadius: 12,
        overflow: "hidden",
        background: "var(--w-bg-soft, #faf8f5)",
      }}
    >
      {attrs.image && (
        <a {...linkProps} style={{ display: "block", minHeight: 200, position: "relative" }}>
          <img
            src={attrs.image}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        </a>
      )}
      <div style={{ padding: "28px 28px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
        <ReactMarkdown components={mdComponents}>{attrs.body}</ReactMarkdown>
        <p style={{ margin: "8px 0 0" }}>
          <a {...linkProps} className="w-btn w-btn--primary">
            {attrs.button}
          </a>
        </p>
      </div>
    </aside>
  );
}

export function MarkdownArticle({ body }: { body: string }) {
  const { segments } = useMemo(() => parseArticleBody(body), [body]);

  return (
    <div className="w-article__body">
      {segments.map((seg, i) => {
        if (seg.type === "md") {
          return (
            <ReactMarkdown key={i} components={mdComponents}>
              {seg.content}
            </ReactMarkdown>
          );
        }
        if (seg.type === "faq") {
          return (
            <Accordion key={i} type="single" collapsible className="w-article__faq">
              {seg.items.map((item, j) => (
                <AccordionItem key={j} value={`faq-${i}-${j}`}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent>
                    <ReactMarkdown components={mdComponents}>{item.a}</ReactMarkdown>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          );
        }
        if (seg.type === "button") {
          return <ArticleButton key={i} attrs={seg.attrs} />;
        }
        return <ArticleCta key={i} attrs={seg.attrs} />;
      })}
    </div>
  );
}

export { Fragment };
