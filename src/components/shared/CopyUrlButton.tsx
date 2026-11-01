"use client";

import { useState } from "react";

export function CopyUrlButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Fallback
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-[13px] border border-[#C9D1D9] bg-white hover:bg-[#F3F4F6] rounded-[6px] px-3 py-1.5 text-[#1E3448] transition-colors shrink-0"
    >
      {copied ? "Copiat" : "Copiază"}
    </button>
  );
}
