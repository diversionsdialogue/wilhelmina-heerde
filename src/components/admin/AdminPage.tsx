import type { ReactNode } from "react";

export function AdminPage({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div style={{ padding: "32px 40px", maxWidth: 1280, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "#0d0d0d" }}>{title}</h1>
          {description && <p style={{ margin: "6px 0 0", color: "#666", fontSize: 14 }}>{description}</p>}
        </div>
        {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
      </header>
      {children}
    </div>
  );
}

export function ComingSoon({ what }: { what: string }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px dashed #d4d4d4",
        borderRadius: 12,
        padding: 48,
        textAlign: "center",
        color: "#666",
      }}
    >
      <p style={{ fontSize: 15, margin: 0 }}>
        Beheer voor <strong>{what}</strong> wordt in een volgende stap toegevoegd volgens het plan.
      </p>
      <p style={{ fontSize: 13, marginTop: 8, color: "#999" }}>
        Het skelet en het dashboard staan; per onderdeel werken we de editor uit.
      </p>
    </div>
  );
}
