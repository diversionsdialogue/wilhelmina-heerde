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
 * `::: faq … :::` blocks. Each FAQ block is parsed into Q/A pairs from
 * `### Question` headings followed by markdown until the next heading.
 */
type FaqPair = { q: string; a: string };
type Segment = { type: "md"; content: string } | { type: "faq"; items: FaqPair[] };

const FAQ_BLOCK_RE = /^:::\s*faq\s*$([\s\S]*?)^:::\s*$/gm;

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
  FAQ_BLOCK_RE.lastIndex = 0;
  while ((match = FAQ_BLOCK_RE.exec(body)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "md", content: body.slice(lastIndex, match.index) });
    }
    const items = parseFaqBlock(match[1]);
    if (items.length) {
      segments.push({ type: "faq", items });
      faqs.push(...items);
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

export function MarkdownArticle({ body }: { body: string }) {
  const { segments } = useMemo(() => parseArticleBody(body), [body]);

  return (
    <div className="w-article__body">
      {segments.map((seg, i) =>
        seg.type === "md" ? (
          <ReactMarkdown key={i} components={mdComponents}>
            {seg.content}
          </ReactMarkdown>
        ) : (
          <Accordion
            key={i}
            type="single"
            collapsible
            className="w-article__faq"
          >
            {seg.items.map((item, j) => (
              <AccordionItem key={j} value={`faq-${i}-${j}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>
                  <ReactMarkdown components={mdComponents}>{item.a}</ReactMarkdown>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ),
      )}
    </div>
  );
}

export { Fragment };
