"use client";

import { useState } from "react";
import { Trash2Icon, LoaderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  url: string;
  label?: string;
  onDeleted?: () => void;
}

export function DeleteButton({ url, label = "Șterge", onDeleted }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) {
        onDeleted?.();
        window.location.reload();
      } else {
        alert("Eroare la ștergere");
      }
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1">
        <Button size="sm" variant="destructive" onClick={handleDelete} disabled={loading} className="h-7 text-xs px-2">
          {loading ? <LoaderIcon className="h-3 w-3 animate-spin" /> : "Confirmă"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} className="h-7 text-xs px-2">
          Anulează
        </Button>
      </span>
    );
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => setConfirming(true)}
      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
      title={label}
    >
      <Trash2Icon className="h-3.5 w-3.5" />
    </Button>
  );
}
