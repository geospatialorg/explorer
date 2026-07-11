"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Item } from "@/lib/db/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoaderIcon, SaveIcon, ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

interface Props {
  item: Item;
  collections: { id: string; title: string }[];
}

const ITEM_TYPES = ["map", "atlas", "plan", "photo", "document", "dataset", "other"];
const GEOREF_OPTIONS = ["none", "accurate", "approximate", "precise"];
const VALIDATION_OPTIONS = ["draft", "published", "rejected"];

export function ItemEditForm({ item, collections }: Props) {
  const router = useRouter();
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""; // only for fetch() calls
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    title: item.title ?? "",
    subtitle: item.subtitle ?? "",
    description: item.description ?? "",
    notes: item.notes ?? "",
    itemType: item.itemType ?? "other",
    georefStatus: item.georefStatus ?? "none",
    yearStart: item.yearStart?.toString() ?? "",
    yearEnd: item.yearEnd?.toString() ?? "",
    language: item.language ?? "",
    keywords: (item.keywords ?? []).flatMap((k) => k.split(/[|;,]+/).map((s) => s.trim()).filter(Boolean)).join(", "),
    scale: item.scale ?? "",
    projectionCrs: item.projectionCrs ?? "",
    author: item.author ?? "",
    institution: item.institution ?? "",
    license: item.license ?? "",
    isPublished: item.isPublished,
    validationStatus: item.validationStatus ?? "draft",
  });

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${base}/api/admin/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Eroare la salvare");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Eroare de rețea");
    } finally {
      setSaving(false);
    }
  }

  const collectionName = collections.find((c) => c.id === item.collectionId)?.title ?? "";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin/items" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeftIcon className="h-3.5 w-3.5" /> Înapoi la items
        </Link>
      </div>

      <div className="p-4 bg-muted/30 rounded-lg text-xs text-muted-foreground space-y-0.5">
        <div><strong>Colecție:</strong> {collectionName}</div>
        <div><strong>Slug:</strong> {item.slug}</div>
        <div><strong>ID:</strong> {item.id}</div>
      </div>

      <div className="grid gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Titlu *</Label>
          <Input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="subtitle">Subtitlu</Label>
          <Input id="subtitle" value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Descriere</Label>
          <Textarea id="description" value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Note</Label>
          <Textarea id="notes" value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={2} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="itemType">Tip item</Label>
            <select
              id="itemType"
              value={form.itemType}
              onChange={(e) => update("itemType", e.target.value)}
              className="w-full border rounded-md px-3 py-1.5 text-sm h-9"
            >
              {ITEM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="georefStatus">Status georeferențiere</Label>
            <select
              id="georefStatus"
              value={form.georefStatus}
              onChange={(e) => update("georefStatus", e.target.value)}
              className="w-full border rounded-md px-3 py-1.5 text-sm h-9"
            >
              {GEOREF_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="yearStart">An</Label>
            <Input id="yearStart" type="number" value={form.yearStart} onChange={(e) => update("yearStart", e.target.value)} placeholder="1938" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="yearEnd">An sfârșit</Label>
            <Input id="yearEnd" type="number" value={form.yearEnd} onChange={(e) => update("yearEnd", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="language">Limbă</Label>
            <Input id="language" value={form.language} onChange={(e) => update("language", e.target.value)} placeholder="ro" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="scale">Scară</Label>
            <Input id="scale" value={form.scale} onChange={(e) => update("scale", e.target.value)} placeholder="1:100000" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="keywords">Cuvinte cheie (separate prin virgulă)</Label>
          <Input id="keywords" value={form.keywords} onChange={(e) => update("keywords", e.target.value)} placeholder="agricultură, cereale, România" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="projectionCrs">Proiecție / CRS</Label>
          <Input id="projectionCrs" value={form.projectionCrs} onChange={(e) => update("projectionCrs", e.target.value)} placeholder="EPSG:4326" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="author">Autor</Label>
          <Input id="author" value={form.author} onChange={(e) => update("author", e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="institution">Instituție</Label>
          <Input id="institution" value={form.institution} onChange={(e) => update("institution", e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="license">Licență</Label>
          <Input id="license" value={form.license} onChange={(e) => update("license", e.target.value)} placeholder="CC BY 4.0" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="validationStatus">Status validare</Label>
            <select
              id="validationStatus"
              value={form.validationStatus}
              onChange={(e) => update("validationStatus", e.target.value)}
              className="w-full border rounded-md px-3 py-1.5 text-sm h-9"
            >
              {VALIDATION_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 mt-7">
            <input
              type="checkbox"
              id="isPublished"
              checked={form.isPublished}
              onChange={(e) => update("isPublished", e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="isPublished" className="cursor-pointer">Publicat</Label>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600 font-medium">Salvat cu succes!</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4" />}
          Salvează
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/items")}>
          Anulează
        </Button>
      </div>
    </form>
  );
}
