"use client";

import { useEffect, useRef, useState } from "react";
import { Table2 } from "lucide-react";
import {
  findFirstMarkdownTable,
  TableEditorModal,
} from "@/components/table-editor-modal";

type SaveState = "idle" | "saving" | "saved" | "error";

type WorkItemEditorProps = {
  item: {
    id: string;
    title: string;
    description: string;
    nextPlan: string;
    note: string | null;
  };
  entryId: string;
  teamId: string;
  cycleId: string;
  index: number;
};

export function WorkItemEditor({
  item,
  entryId,
  teamId,
  cycleId,
  index,
}: WorkItemEditorProps) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description);
  const [nextPlan, setNextPlan] = useState(item.nextPlan);
  const [note, setNote] = useState(item.note ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [tableTarget, setTableTarget] = useState<"description" | "nextPlan" | null>(null);
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSaveState("saving");

      try {
        const response = await fetch(`/api/write/items/${item.id}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({
            entryId,
            teamId,
            cycleId,
            title,
            description,
            nextPlan,
            note,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("save_failed");
        }

        const result = (await response.json()) as { savedAt?: string };
        setSavedAt(result.savedAt ?? new Date().toISOString());
        setSaveState("saved");
      } catch (error) {
        if (!controller.signal.aborted) {
          setSaveState("error");
        }
      }
    }, 900);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [cycleId, description, entryId, item.id, nextPlan, note, teamId, title]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold">보고 항목 {index + 1}</h2>
        <span className={saveStateClassName(saveState)}>
          {saveStateLabel(saveState, savedAt)}
        </span>
      </div>
      <label>
        <span className="mb-2 block text-sm font-semibold">업무명</span>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded border border-[#d6dbe1] px-3 py-2"
          placeholder="예: 양재역세권 활성화사업 지원자문단 회의"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">지난 업무 실적</span>
            <button
              type="button"
              onClick={() => setTableTarget("description")}
              className="inline-flex items-center gap-1 rounded border border-[#d6dbe1] px-2 py-1 text-xs font-semibold"
            >
              <Table2 className="h-3.5 w-3.5" aria-hidden />
              표
            </button>
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={8}
            className="w-full resize-y rounded border border-[#d6dbe1] px-3 py-2"
            placeholder={"◦ 일시:\n◦ 장소:\n◦ 주요내용\n- "}
          />
        </label>
        <label>
          <span className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">다음 주 계획</span>
            <button
              type="button"
              onClick={() => setTableTarget("nextPlan")}
              className="inline-flex items-center gap-1 rounded border border-[#d6dbe1] px-2 py-1 text-xs font-semibold"
            >
              <Table2 className="h-3.5 w-3.5" aria-hidden />
              표
            </button>
          </span>
          <textarea
            value={nextPlan}
            onChange={(event) => setNextPlan(event.target.value)}
            rows={8}
            className="w-full resize-y rounded border border-[#d6dbe1] px-3 py-2"
            placeholder={"◦ 추진기간:\n◦ 주요내용\n- "}
          />
        </label>
      </div>
      <label>
        <span className="mb-2 block text-sm font-semibold">비고</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          className="w-full resize-y rounded border border-[#d6dbe1] px-3 py-2"
          placeholder="필요한 보충 내용을 입력하세요."
        />
      </label>
      <TableEditorModal
        open={tableTarget !== null}
        title={tableTarget === "description" ? "지난 업무 실적 표 편집" : "다음 주 계획 표 편집"}
        initialMarkdown={findFirstMarkdownTable(currentTableText(tableTarget))?.markdown ?? null}
        onClose={() => setTableTarget(null)}
        onSave={(markdown) => {
          if (tableTarget === "description") {
            setDescription((current) => upsertMarkdownTable(current, markdown));
          }

          if (tableTarget === "nextPlan") {
            setNextPlan((current) => upsertMarkdownTable(current, markdown));
          }

          setTableTarget(null);
        }}
      />
    </div>
  );

  function currentTableText(target: "description" | "nextPlan" | null) {
    if (target === "description") return description;
    if (target === "nextPlan") return nextPlan;
    return "";
  }
}

function saveStateLabel(saveState: SaveState, savedAt: string | null) {
  if (saveState === "saving") return "저장 중";
  if (saveState === "error") return "저장 실패";
  if (saveState === "saved") {
    return savedAt ? `저장됨 ${formatTime(savedAt)}` : "저장됨";
  }

  return "자동 저장";
}

function saveStateClassName(saveState: SaveState) {
  const base = "rounded border px-3 py-1 text-xs font-semibold";

  if (saveState === "saving") {
    return `${base} border-[#d6dbe1] text-[#667085]`;
  }

  if (saveState === "error") {
    return `${base} border-[#b42318] text-[#b42318]`;
  }

  if (saveState === "saved") {
    return `${base} border-[#2457a7] text-[#2457a7]`;
  }

  return `${base} border-[#d6dbe1] text-[#667085]`;
}

function formatTime(value: string) {
  const date = new Date(value);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function upsertMarkdownTable(text: string, markdown: string) {
  const table = findFirstMarkdownTable(text);
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  if (table) {
    return [
      ...lines.slice(0, table.startLine),
      markdown,
      ...lines.slice(table.endLine),
    ]
      .join("\n")
      .replace(/\n{3,}/g, "\n\n");
  }

  const separator = text.trim().length > 0 ? "\n\n" : "";
  return `${text}${separator}${markdown}`;
}
