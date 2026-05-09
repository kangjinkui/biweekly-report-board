import { ReportRichText } from "@/components/report-rich-text";
import {
  normalizeWorkItemType,
  usesCurrent,
  usesPrevious,
  type WorkItemType,
} from "@/lib/work-items";

type ReportWorkItem = {
  id?: string;
  title: string;
  description: string;
  nextPlan: string;
  note?: string | null;
  itemType?: WorkItemType | string;
};

type ReportTwoColumnTableProps = {
  items: ReportWorkItem[];
  previousLabel: string;
  currentLabel: string;
};

export function ReportTwoColumnTable({
  items,
  previousLabel,
  currentLabel,
}: ReportTwoColumnTableProps) {
  const previousItems = items.filter((item) => {
    const type = normalizeWorkItemType(item.itemType);
    return usesPrevious(type) && hasPreviousContent(item);
  });
  const currentItems = items.filter((item) => {
    const type = normalizeWorkItemType(item.itemType);
    return usesCurrent(type) && hasCurrentContent(item);
  });

  return (
    <table className="gov-table w-full border-collapse text-sm leading-6">
      <thead>
        <tr>
          <th className="w-1/2 border px-3 py-2 text-center font-semibold">
            {previousLabel}
          </th>
          <th className="w-1/2 border px-3 py-2 text-center font-semibold">
            {currentLabel}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr className="align-top">
          <td className="border px-3 py-3">
            <ReportColumn items={previousItems} side="previous" />
          </td>
          <td className="border px-3 py-3">
            <ReportColumn items={currentItems} side="current" />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function ReportColumn({
  items,
  side,
}: {
  items: ReportWorkItem[];
  side: "previous" | "current";
}) {
  if (items.length === 0) {
    return <p className="text-[#98a2b3]">입력된 내용 없음</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => {
        const type = normalizeWorkItemType(item.itemType);
        const body = side === "previous" ? item.description : item.nextPlan;
        const note =
          side === "previous" || type === "current_only" ? item.note : null;

        return (
          <div
            key={item.id ?? `${side}-${index}`}
            className="border-b border-[#e4e9f0] pb-4 last:border-b-0 last:pb-0"
          >
            <ReportCell title={item.title} body={body} note={note} />
          </div>
        );
      })}
    </div>
  );
}

function ReportCell({
  title,
  body,
  note,
}: {
  title: string;
  body: string;
  note?: string | null;
}) {
  return (
    <div>
      <p className="font-semibold">■ {title || "업무명 없음"}</p>
      {body ? (
        <div className="mt-2">
          <ReportRichText text={body} />
        </div>
      ) : null}
      {note ? (
        <div className="mt-2 text-[#344054]">
          <p className="font-semibold">※ 비고</p>
          <ReportRichText text={note} />
        </div>
      ) : null}
    </div>
  );
}

function hasPreviousContent(item: ReportWorkItem) {
  return Boolean(
    item.title.trim() || item.description.trim() || item.note?.trim(),
  );
}

function hasCurrentContent(item: ReportWorkItem) {
  return Boolean(item.title.trim() || item.nextPlan.trim() || item.note?.trim());
}
