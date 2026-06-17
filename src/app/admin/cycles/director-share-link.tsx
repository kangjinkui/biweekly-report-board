"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

export function DirectorShareLinkButton({ shareToken }: { shareToken: string | null }) {
  const [copied, setCopied] = useState(false);

  const token = shareToken;
  if (!token) return null;

  async function copyLink() {
    const url = `${window.location.origin}/share/director/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      className="gov-subtle-action inline-flex items-center gap-2 border px-3 py-2 text-sm"
      title="패드 공유 시 서버 PC의 IP 주소로 접속한 뒤 복사하세요"
    >
      <Copy className="h-4 w-4" aria-hidden />
      {copied ? "복사됨" : "공유 링크 복사"}
    </button>
  );
}
