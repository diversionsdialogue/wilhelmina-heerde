import { useRef, type CSSProperties } from "react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textareaStyle?: CSSProperties;
};

type Snippet = {
  label: string;
  title: string;
  /** Returns [textToInsert, selectionOffsetFromStart, selectionLength]. */
  build: (selected: string) => { text: string; selStart: number; selEnd: number };
  /** If true, the insertion is forced to start on its own new line. */
  block?: boolean;
};

const SNIPPETS: Snippet[] = [
  {
    label: "H2",
    title: "Kop niveau 2",
    block: true,
    build: (s) => {
      const t = s || "Kop";
      const text = `## ${t}\n\n`;
      return { text, selStart: 3, selEnd: 3 + t.length };
    },
  },
  {
    label: "H3",
    title: "Kop niveau 3",
    block: true,
    build: (s) => {
      const t = s || "Subkop";
      const text = `### ${t}\n\n`;
      return { text, selStart: 4, selEnd: 4 + t.length };
    },
  },
  {
    label: "B",
    title: "Vet",
    build: (s) => {
      const t = s || "vette tekst";
      return { text: `**${t}**`, selStart: 2, selEnd: 2 + t.length };
    },
  },
  {
    label: "I",
    title: "Cursief",
    build: (s) => {
      const t = s || "cursief";
      return { text: `*${t}*`, selStart: 1, selEnd: 1 + t.length };
    },
  },
  {
    label: "Link",
    title: "Link invoegen",
    build: (s) => {
      const t = s || "linktekst";
      const text = `[${t}](https://)`;
      return { text, selStart: text.length - 9, selEnd: text.length - 1 };
    },
  },
  {
    label: "• Lijst",
    title: "Opsomming",
    block: true,
    build: (s) => {
      const lines = (s || "Item 1\nItem 2\nItem 3").split("\n");
      const text = lines.map((l) => `- ${l}`).join("\n") + "\n\n";
      return { text, selStart: 2, selEnd: 2 + lines[0].length };
    },
  },
  {
    label: "1. Lijst",
    title: "Genummerde lijst",
    block: true,
    build: (s) => {
      const lines = (s || "Item 1\nItem 2\nItem 3").split("\n");
      const text = lines.map((l, i) => `${i + 1}. ${l}`).join("\n") + "\n\n";
      return { text, selStart: 3, selEnd: 3 + lines[0].length };
    },
  },
  {
    label: "❝ Quote",
    title: "Citaat",
    block: true,
    build: (s) => {
      const t = s || "Citaat hier";
      const text = `> ${t}\n\n`;
      return { text, selStart: 2, selEnd: 2 + t.length };
    },
  },
  {
    label: "FAQ",
    title: "FAQ-blok invoegen",
    block: true,
    build: () => {
      const text =
        "::: faq\n" +
        "### Vraag 1?\n" +
        "Antwoord op vraag 1.\n\n" +
        "### Vraag 2?\n" +
        "Antwoord op vraag 2.\n" +
        ":::\n\n";
      const selStart = text.indexOf("Vraag 1?");
      return { text, selStart, selEnd: selStart + "Vraag 1?".length };
    },
  },
  {
    label: "Afbeelding",
    title: "Afbeelding invoegen",
    build: (s) => {
      const alt = s || "alt-tekst";
      const text = `![${alt}](https://)`;
      return { text, selStart: text.length - 9, selEnd: text.length - 1 };
    },
  },
  {
    label: "Button",
    title: "Knop invoegen",
    block: true,
    build: (s) => {
      const label = s || "Lees meer";
      const text = `::: button href="https://" variant="primary"\n${label}\n:::\n\n`;
      const selStart = text.indexOf('href="') + 6;
      const selEnd = selStart + "https://".length;
      return { text, selStart, selEnd };
    },
  },
  {
    label: "CTA",
    title: "Call-to-action blok (kop, tekst, knop, afbeelding)",
    block: true,
    build: () => {
      const text =
        '::: cta href="https://" image="https://" button="Lees meer"\n' +
        "## Titel van de CTA\n" +
        "Korte begeleidende tekst die uitlegt waarom de lezer hier moet klikken.\n" +
        ":::\n\n";
      const selStart = text.indexOf("Titel van de CTA");
      return { text, selStart, selEnd: selStart + "Titel van de CTA".length };
    },
  },
];

function btn(): CSSProperties {
  return {
    padding: "6px 10px",
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 6,
    border: "1px solid hsl(var(--border))",
    background: "hsl(var(--background))",
    color: "hsl(var(--foreground))",
    cursor: "pointer",
    lineHeight: 1,
  };
}

export function MarkdownEditor({ value, onChange, placeholder, textareaStyle }: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  const apply = (snip: Snippet) => {
    const ta = ref.current;
    if (!ta) return;
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const selected = value.slice(start, end);

    let insertStart = start;
    let prefix = "";
    if (snip.block) {
      // Ensure the block starts on a new line
      const before = value.slice(0, start);
      if (before.length > 0 && !before.endsWith("\n\n")) {
        prefix = before.endsWith("\n") ? "\n" : "\n\n";
      }
    }

    const { text, selStart, selEnd } = snip.build(selected);
    const full = prefix + text;
    const next = value.slice(0, start) + full + value.slice(end);
    onChange(next);

    const newSelStart = insertStart + prefix.length + selStart;
    const newSelEnd = insertStart + prefix.length + selEnd;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newSelStart, newSelEnd);
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {SNIPPETS.map((s) => (
          <button
            key={s.label}
            type="button"
            title={s.title}
            style={btn()}
            onClick={() => apply(s)}
          >
            {s.label}
          </button>
        ))}
      </div>
      <textarea
        ref={ref}
        style={textareaStyle}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
