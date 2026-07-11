"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Collection } from "@/lib/db/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LoaderIcon, SaveIcon, ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

interface Props {
  collection: Collection;
}

export function CollectionEditForm({ collection }: Props) {
  const router = useRouter();
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? ""; // only for fetch() calls
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    title: collection.title ?? "",
    description: collection.description ?? "",
    type: collection.type ?? "",
    author: collection.author ?? "",
    institution: collection.institution ?? "",
    license: collection.license ?? "",
    language: collection.language ?? "",
    yearStart: collection.yearStart?.toString() ?? "",
    yearEnd: collection.yearEnd?.toString() ?? "",
    thumbnailPath: collection.thumbnailPath ?? "",
    tags: (collection.tags ?? []).join(", "),
    isPublished: collection.isPublished,
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
      const res = await fetch(`${base}/api/admin/collections/${collection.id}`, {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin/collections" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeftIcon className="h-3.5 w-3.5" /> Înapoi la colecții
        </Link>
      </div>

      <div className="p-4 bg-muted/30 rounded-lg text-xs text-muted-foreground">
        <strong>Slug:</strong> {collection.slug} &nbsp;|&nbsp; <strong>ID:</strong> {collection.id}
      </div>

      <div className="grid gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Titlu *</Label>
          <Input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} required />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Descriere</Label>
          <Textarea id="description" value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="type">Tip</Label>
            <Input id="type" value={form.type} onChange={(e) => update("type", e.target.value)} placeholder="atlas, harta, etc." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="language">Limbă</Label>
            <Input id="language" value={form.language} onChange={(e) => update("language", e.target.value)} placeholder="ro, en…" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="yearStart">An început</Label>
            <Input id="yearStart" type="number" value={form.yearStart} onChange={(e) => update("yearStart", e.target.value)} placeholder="1938" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="yearEnd">An sfârșit</Label>
            <Input id="yearEnd" type="number" value={form.yearEnd} onChange={(e) => update("yearEnd", e.target.value)} placeholder="1940" />
          </div>
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

        <div className="space-y-1.5">
          <Label htmlFor="thumbnailPath">URL Thumbnail</Label>
          <Input id="thumbnailPath" value={form.thumbnailPath} onChange={(e) => update("thumbnailPath", e.target.value)} placeholder="https://…" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tags">Etichete (separate prin virgulă)</Label>
          <Input id="tags" value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="agricultură, atlas, 1938" />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublished"
            checked={form.isPublished}
            onChange={(e) => update("isPublished", e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="isPublished" className="cursor-pointer">Publicat (vizibil în aplicație)</Label>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600 font-medium">Salvat cu succes!</p>}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving} className="gap-2">
          {saving ? <LoaderIcon className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4" />}
          Salvează
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/collections")}>
          Anulează
        </Button>
      </div>
    </form>
  );
}
