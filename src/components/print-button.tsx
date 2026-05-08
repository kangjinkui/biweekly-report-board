"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => globalThis.print()}
      className="gov-action inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
    >
      <Printer className="h-4 w-4" aria-hidden />
      PDF 저장
    </button>
  );
}
