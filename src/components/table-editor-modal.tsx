"use client";

import { useEffect, useState, type ClipboardEvent } from "react";
import { Check, Plus, Table2, Trash2, X } from "lucide-react";

type TableEditorModalProps = {
  open: boolean;
  title: string;
  initialMarkdown: string | null;
  onClose: () => void;
  onSave: (markdown: string) => void;
};

const DEFAULT_TABLE = [
  ["구분", "총계", "비고"],
  ["합계", "", ""],
  ["", "", ""],
];

export function TableEditorModal({
  open,
  title,
  initialMarkdown,
  onClose,
  onSave,
}: TableEditorModalProps) {
  const [grid, setGrid] = useState<string[][]>(DEFAULT_TABLE);

  useEffect(() => {
    if (!open) return;
    setGrid(parseMarkdownTable(initialMarkdown) ?? DEFAULT_TABLE);
  }, [initialMarkdown, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl flex-col rounded border border-[#d6dbe1] bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-[#d6dbe1] px-5 py-4">
          <div className="flex items-center gap-3">
            <Table2 className="h-5 w-5 text-[#2457a7]" aria-hidden />
            <h2 className="font-semibold">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-[#d6dbe1]"
            title="닫기"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <div className="overflow-auto p-5">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setGrid(addRow(grid))}
              className="inline-flex items-center gap-2 rounded border border-[#d6dbe1] px-3 py-2 text-sm"
            >
              <Plus className="h-4 w-4" aria-hidden />
              행 추가
            </button>
            <button
              type="button"
              onClick={() => setGrid(removeRow(grid))}
              className="inline-flex items-center gap-2 rounded border border-[#d6dbe1] px-3 py-2 text-sm"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              행 삭제
            </button>
            <button
              type="button"
              onClick={() => setGrid(addColumn(grid))}
              className="inline-flex items-center gap-2 rounded border border-[#d6dbe1] px-3 py-2 text-sm"
            >
              <Plus className="h-4 w-4" aria-hidden />
              열 추가
            </button>
            <button
              type="button"
              onClick={() => setGrid(removeColumn(grid))}
              className="inline-flex items-center gap-2 rounded border border-[#d6dbe1] px-3 py-2 text-sm"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              열 삭제
            </button>
          </div>

          <p className="mb-3 text-sm text-[#667085]">
            Excel에서 셀 범위를 복사한 뒤 첫 칸에 붙여넣으면 표로 들어갑니다.
          </p>

          <table className="w-full min-w-[720px] border-collapse text-sm">
            <tbody>
              {grid.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, columnIndex) => (
                    <td key={columnIndex} className="border border-[#d6dbe1] p-1">
                      <input
                        value={cell}
                        onChange={(event) =>
                          setGrid(updateCell(grid, rowIndex, columnIndex, event.target.value))
                        }
                        onPaste={(event) => {
                          const pasted = event.clipboardData.getData("text");
                          if (!pasted.includes("\t") && !pasted.includes("\n")) return;
                          event.preventDefault();
                          setGrid(pasteGrid(grid, rowIndex, columnIndex, pasted));
                        }}
                        className={
                          rowIndex === 0
                            ? "w-full bg-[#f7f8fa] px-2 py-2 font-semibold outline-[#2457a7]"
                            : "w-full px-2 py-2 outline-[#2457a7]"
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="flex justify-end gap-2 border-t border-[#d6dbe1] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[#d6dbe1] px-4 py-2 text-sm font-semibold"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => onSave(toMarkdownTable(grid))}
            className="inline-flex items-center gap-2 rounded bg-[#2457a7] px-4 py-2 text-sm font-semibold text-white"
          >
            <Check className="h-4 w-4" aria-hidden />
            표 넣기
          </button>
        </footer>
      </div>
    </div>
  );
}

export function findFirstMarkdownTable(text: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  for (let index = 0; index < lines.length - 1; index += 1) {
    if (isTableRow(lines[index]) && isSeparatorRow(lines[index + 1])) {
      let end = index + 2;
      while (end < lines.length && isTableRow(lines[end])) {
        end += 1;
      }

      return {
        startLine: index,
        endLine: end,
        markdown: lines.slice(index, end).join("\n"),
      };
    }
  }

  return null;
}

function parseMarkdownTable(markdown: string | null) {
  if (!markdown) return null;
  const lines = markdown.replace(/\r\n/g, "\n").split("\n").filter(Boolean);
  if (lines.length < 2 || !isSeparatorRow(lines[1])) return null;

  const header = splitTableRow(lines[0]);
  const rows = lines.slice(2).filter(isTableRow).map(splitTableRow);
  const columnCount = Math.max(header.length, ...rows.map((row) => row.length), 1);

  return [header, ...rows].map((row) => normalizeRow(row, columnCount));
}

function toMarkdownTable(grid: string[][]) {
  const columnCount = Math.max(...grid.map((row) => row.length), 1);
  const normalized = grid.map((row) => normalizeRow(row, columnCount));
  const [header = []] = normalized;
  const rows = normalized.slice(1);
  const separator = Array.from({ length: columnCount }, () => "---");

  return [header, separator, ...rows]
    .map((row) => `| ${row.map(escapeCell).join(" | ")} |`)
    .join("\n");
}

function addRow(grid: string[][]) {
  const columnCount = grid[0]?.length ?? 1;
  return [...grid, Array.from({ length: columnCount }, () => "")];
}

function removeRow(grid: string[][]) {
  if (grid.length <= 2) return grid;
  return grid.slice(0, -1);
}

function addColumn(grid: string[][]) {
  return grid.map((row) => [...row, ""]);
}

function removeColumn(grid: string[][]) {
  if ((grid[0]?.length ?? 0) <= 2) return grid;
  return grid.map((row) => row.slice(0, -1));
}

function updateCell(grid: string[][], rowIndex: number, columnIndex: number, value: string) {
  return grid.map((row, currentRowIndex) =>
    currentRowIndex === rowIndex
      ? row.map((cell, currentColumnIndex) =>
          currentColumnIndex === columnIndex ? value : cell,
        )
      : row,
  );
}

function pasteGrid(
  grid: string[][],
  startRow: number,
  startColumn: number,
  pasted: string,
) {
  const pastedRows = pasted
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((row) => row.length > 0)
    .map((row) => row.split("\t"));

  if (pastedRows.length === 0) return grid;

  const rowCount = Math.max(grid.length, startRow + pastedRows.length);
  const columnCount = Math.max(
    grid[0]?.length ?? 0,
    startColumn + Math.max(...pastedRows.map((row) => row.length)),
  );
  const next = Array.from({ length: rowCount }, (_, rowIndex) =>
    normalizeRow(grid[rowIndex] ?? [], columnCount),
  );

  pastedRows.forEach((row, rowOffset) => {
    row.forEach((cell, columnOffset) => {
      next[startRow + rowOffset][startColumn + columnOffset] = cell.trim();
    });
  });

  return next;
}

function isTableRow(line: string) {
  const trimmed = line.trim();
  return trimmed.includes("|") && splitTableRow(trimmed).length >= 2;
}

function isSeparatorRow(line: string) {
  const cells = splitTableRow(line);
  return (
    cells.length >= 2 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell.replace(/\s/g, "")))
  );
}

function splitTableRow(line: string) {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split("|").map((cell) => cell.trim());
}

function normalizeRow(row: string[], length: number) {
  return Array.from({ length }, (_, index) => row[index] ?? "");
}

function escapeCell(cell: string) {
  return cell.replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}
