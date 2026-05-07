type ReportRichTextProps = {
  text: string;
};

type TextBlock = {
  type: "text";
  lines: string[];
};

type TableBlock = {
  type: "table";
  header: string[];
  alignments: Array<"left" | "center" | "right">;
  rows: string[][];
};

type ReportBlock = TextBlock | TableBlock;

export function ReportRichText({ text }: ReportRichTextProps) {
  const blocks = parseReportBlocks(text);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3">
      {blocks.map((block, index) => {
        if (block.type === "table") {
          return <ReportTable key={index} block={block} />;
        }

        return (
          <p key={index} className="whitespace-pre-wrap">
            {block.lines.join("\n")}
          </p>
        );
      })}
    </div>
  );
}

function ReportTable({ block }: { block: TableBlock }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm leading-6">
        <thead>
          <tr>
            {block.header.map((cell, index) => (
              <th
                key={index}
                className={`border border-[#171717] bg-[#f7f8fa] px-2 py-1 font-semibold ${alignmentClass(
                  block.alignments[index],
                )}`}
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {block.header.map((_, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`border border-[#171717] px-2 py-1 align-top ${alignmentClass(
                    block.alignments[cellIndex],
                  )}`}
                >
                  {row[cellIndex] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseReportBlocks(text: string): ReportBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReportBlock[] = [];
  let textLines: string[] = [];
  let index = 0;

  while (index < lines.length) {
    const current = lines[index];
    const next = lines[index + 1];

    if (isTableRow(current) && next && isSeparatorRow(next)) {
      flushTextBlock(blocks, textLines);
      textLines = [];

      const header = splitTableRow(current);
      const alignments = splitTableRow(next).map(parseAlignment);
      const rows: string[][] = [];
      index += 2;

      while (index < lines.length && isTableRow(lines[index])) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }

      blocks.push({
        type: "table",
        header,
        alignments: normalizeAlignments(alignments, header.length),
        rows,
      });
      continue;
    }

    textLines.push(current);
    index += 1;
  }

  flushTextBlock(blocks, textLines);
  return blocks;
}

function flushTextBlock(blocks: ReportBlock[], lines: string[]) {
  const trimmed = trimBlankEdges(lines);

  if (trimmed.length > 0) {
    blocks.push({
      type: "text",
      lines: trimmed,
    });
  }
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

  if (trimmed.startsWith("|")) {
    trimmed = trimmed.slice(1);
  }

  if (trimmed.endsWith("|")) {
    trimmed = trimmed.slice(0, -1);
  }

  return trimmed.split("|").map((cell) => cell.trim());
}

function parseAlignment(cell: string): "left" | "center" | "right" {
  const value = cell.replace(/\s/g, "");

  if (value.startsWith(":") && value.endsWith(":")) {
    return "center";
  }

  if (value.endsWith(":")) {
    return "right";
  }

  return "left";
}

function normalizeAlignments(
  alignments: Array<"left" | "center" | "right">,
  length: number,
) {
  return Array.from({ length }, (_, index) => alignments[index] ?? "left");
}

function alignmentClass(alignment: "left" | "center" | "right" = "left") {
  if (alignment === "center") return "text-center";
  if (alignment === "right") return "text-right";
  return "text-left";
}

function trimBlankEdges(lines: string[]) {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start].trim() === "") {
    start += 1;
  }

  while (end > start && lines[end - 1].trim() === "") {
    end -= 1;
  }

  return lines.slice(start, end);
}
