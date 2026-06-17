"use client";

import { Trash2 } from "lucide-react";

export function DeleteTeamButton({ teamName }: { teamName: string }) {
  return (
    <button
      className="inline-flex h-9 w-9 items-center justify-center border border-[#f0a9a9] text-[#b42318]"
      title="팀 삭제"
      onClick={(event) => {
        if (!window.confirm(`${teamName} 팀을 삭제하시겠습니까? 기존 보고서 입력도 함께 삭제됩니다.`)) {
          event.preventDefault();
        }
      }}
    >
      <Trash2 className="h-4 w-4" aria-hidden />
    </button>
  );
}
