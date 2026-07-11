"use client";
import { useState, useRef } from "react";
import { UploadIcon, CheckCircleIcon, XCircleIcon, Loader2Icon, FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface IngestResult {
  collections?: { inserted: number; updated: number; errors: string[] };
  items?: { inserted: number; updated: number; errors: string[]; insertedItems?: string[]; updatedItems?: string[] };
  error?: string;
}

export default function AdminIngestPage() {
  const [collectionFile, setCollectionFile] = useState<File | null>(null);
  const [itemFile, setItemFile] = useState<File | null>(null);
  const [collectionSlug, setCollectionSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [mode, setMode] = useState<"collections" | "items">("collections");
  const collRef = useRef<HTMLInputElement>(null);
  const itemRef = useRef<HTMLInputElement>(null);

  async function handleIngest() {
    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("mode", mode);
      if (mode === "collections" && collectionFile) {
        formData.append("file", collectionFile);
      } else if (mode === "items" && itemFile) {
        formData.append("file", itemFile);
        formData.append("collectionSlug", collectionSlug);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/admin/ingest`, { method: "POST", body: formData });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: (err as Error).message });
    } finally {
      setLoading(false);
    }
  }

  const canIngest = mode === "collections" ? !!collectionFile : !!itemFile && !!collectionSlug;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Admin — Ingestie CSV</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Importați colecții și items din fișiere CSV conform template-urilor.
          </p>
        </div>

        <Separator />

        {/* Mode selector */}
        <div className="flex gap-2">
          <Button variant={mode === "collections" ? "default" : "outline"} size="sm" onClick={() => { setMode("collections"); setResult(null); }}>
            Colecții
          </Button>
          <Button variant={mode === "items" ? "default" : "outline"} size="sm" onClick={() => { setMode("items"); setResult(null); }}>
            Items
          </Button>
        </div>

        {/* Upload form */}
        <div className="space-y-4 rounded-xl border p-5 bg-muted/30">
          {mode === "collections" ? (
            <div className="space-y-2">
              <Label>Fișier colecții CSV</Label>
              <p className="text-xs text-muted-foreground">
                Coloane: <code className="bg-muted px-1 rounded">uuid, title, description, keywords, thumbnail_path, type, author, institution, license, year, language, catalog_link</code>
              </p>
              <div className="flex items-center gap-3">
                <input ref={collRef} type="file" accept=".csv" className="hidden"
                  onChange={(e) => setCollectionFile(e.target.files?.[0] ?? null)} />
                <Button variant="outline" size="sm" onClick={() => collRef.current?.click()}>
                  <FileTextIcon className="h-4 w-4 mr-2" />
                  {collectionFile ? collectionFile.name : "Selectați fișierul"}
                </Button>
                {collectionFile && <span className="text-xs text-muted-foreground">{(collectionFile.size / 1024).toFixed(1)} KB</span>}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Slug colecție</Label>
                <Input value={collectionSlug} onChange={(e) => setCollectionSlug(e.target.value)}
                  placeholder="ex: atlas-agricol-1938" />
                <p className="text-xs text-muted-foreground">Colecția trebuie să existe deja în baza de date.</p>
              </div>
              <div className="space-y-2">
                <Label>Fișier items CSV</Label>
                <p className="text-xs text-muted-foreground">
                  Coloane: <code className="bg-muted px-1 rounded">uuid, type, spatial, title, subtitle, year, language, keywords, notes, layer_name, cog_path, wms_path, thumbnail_path</code>
                </p>
                <div className="flex items-center gap-3">
                  <input ref={itemRef} type="file" accept=".csv" className="hidden"
                    onChange={(e) => setItemFile(e.target.files?.[0] ?? null)} />
                  <Button variant="outline" size="sm" onClick={() => itemRef.current?.click()}>
                    <FileTextIcon className="h-4 w-4 mr-2" />
                    {itemFile ? itemFile.name : "Selectați fișierul"}
                  </Button>
                  {itemFile && <span className="text-xs text-muted-foreground">{(itemFile.size / 1024).toFixed(1)} KB</span>}
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleIngest} disabled={!canIngest || loading} className="w-full">
            {loading ? <><Loader2Icon className="h-4 w-4 mr-2 animate-spin" /> Se procesează…</> : <><UploadIcon className="h-4 w-4 mr-2" /> Ingestie CSV</>}
          </Button>
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-xl border p-5 space-y-3 ${result.error ? "border-destructive/50 bg-destructive/5" : "border-green-500/30 bg-green-50"}`}>
            {result.error ? (
              <div className="flex items-center gap-2 text-destructive">
                <XCircleIcon className="h-5 w-5" />
                <span className="font-medium">Eroare: {result.error}</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span className="font-semibold">Ingestie completă</span>
                </div>
                {result.collections && (
                  <div className="text-sm space-y-1">
                    <p>Colecții inserate: <strong>{result.collections.inserted}</strong></p>
                    <p>Colecții actualizate: <strong>{result.collections.updated}</strong></p>
                    {result.collections.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-destructive cursor-pointer text-xs">{result.collections.errors.length} erori</summary>
                        <ul className="mt-1 space-y-0.5 text-xs text-destructive">
                          {result.collections.errors.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
                {result.items && (
                  <div className="text-sm space-y-1">
                    <p>Items inserați: <strong>{result.items.inserted}</strong></p>
                    {result.items.insertedItems && result.items.insertedItems.length > 0 && (
                      <details className="mt-1">
                        <summary className="text-green-700 cursor-pointer text-xs">Vezi item-uri inserate</summary>
                        <ul className="mt-1 space-y-0.5 text-xs text-green-700 max-h-32 overflow-y-auto">
                          {result.items.insertedItems.map((title, i) => <li key={i}>{title}</li>)}
                        </ul>
                      </details>
                    )}
                    <p>Items actualizați: <strong>{result.items.updated}</strong></p>
                    {result.items.updatedItems && result.items.updatedItems.length > 0 && (
                      <details className="mt-1">
                        <summary className="text-blue-700 cursor-pointer text-xs">Vezi item-uri actualizate</summary>
                        <ul className="mt-1 space-y-0.5 text-xs text-blue-700 max-h-32 overflow-y-auto">
                          {result.items.updatedItems.map((title, i) => <li key={i}>{title}</li>)}
                        </ul>
                      </details>
                    )}
                    {result.items.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-destructive cursor-pointer text-xs">{result.items.errors.length} erori</summary>
                        <ul className="mt-1 space-y-0.5 text-xs text-destructive">
                          {result.items.errors.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <Separator />
        <div className="text-xs text-muted-foreground space-y-1">
          <p>Template-uri disponibile în <code>/tmp/template-colectie.csv</code> și <code>/tmp/template-item.csv</code>.</p>
          <p>Ingestia este idempotentă: re-importul actualizează înregistrările existente după UUID sau slug.</p>
        </div>
      </div>
    </div>
  );
}
