import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminPage } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { fetchHelloBar, saveHelloBar } from "@/lib/hello-bar";

export const Route = createFileRoute("/_authenticated/admin/hellobar")({
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [message, setMessage] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHelloBar()
      .then((d) => {
        if (d) {
          setMessage(d.message ?? "");
          setLinkUrl(d.link_url ?? "");
          setActive(!!d.active);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      await saveHelloBar({
        message: message.trim(),
        link_url: linkUrl.trim() || null,
        active,
      });
      qc.invalidateQueries({ queryKey: ["hello-bar"] });
      setStatus("Opgeslagen");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminPage
      title="Hellobar"
      description="Site-brede aankondigingsbalk bovenaan elke pagina. Op mobile loopt de tekst als tickertape."
    >
      <form
        onSubmit={onSave}
        className="space-y-5 rounded-lg border border-border bg-card p-6 max-w-2xl"
      >
        <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-background p-3">
          <div>
            <Label htmlFor="hb-active" className="text-sm font-medium">
              Actief
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Aan = balk wordt op de hele site getoond.
            </p>
          </div>
          <Switch id="hb-active" checked={active} onCheckedChange={setActive} disabled={loading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hb-message">Bericht</Label>
          <Textarea
            id="hb-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Bijv. Concert verplaatst naar zaterdag 12 juli."
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hb-link">Link (optioneel)</Label>
          <Input
            id="hb-link"
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://… of /nieuws/…"
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Als je een link toevoegt, wordt de tekst klikbaar.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving || loading}>
            {saving ? "Opslaan…" : "Opslaan"}
          </Button>
          {status && <span className="text-sm text-emerald-600">{status}</span>}
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>
      </form>
    </AdminPage>
  );
}
