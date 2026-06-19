"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

type CopyLinkButtonProps = {
  value: string;
};

export function CopyLinkButton({ value }: CopyLinkButtonProps) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("error");
    }
    window.setTimeout(() => setState("idle"), 1400);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 border border-[#c8d3df] bg-white px-3 py-2 text-sm font-semibold text-[#005bac]"
    >
      <Copy className="h-4 w-4" aria-hidden />
      {state === "copied" ? "복사됨" : state === "error" ? "복사 실패" : "링크 복사"}
    </button>
  );
}
