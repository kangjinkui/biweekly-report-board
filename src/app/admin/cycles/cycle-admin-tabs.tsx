import Link from "next/link";

type CycleAdminTab = "settings" | "links";

export function CycleAdminTabs({ active }: { active: CycleAdminTab }) {
  const tabs = [
    { href: "/admin/cycles", label: "회차 설정", value: "settings" },
    { href: "/admin/cycles/links", label: "작성 링크", value: "links" },
  ] as const;

  return (
    <nav className="mb-6 flex gap-2 border-b border-[#c8d3df]" aria-label="회차 관리 탭">
      {tabs.map((tab) => (
        <Link
          key={tab.value}
          href={tab.href}
          className={
            tab.value === active
              ? "border-b-2 border-[#005bac] px-4 py-3 text-sm font-semibold text-[#003f7d]"
              : "px-4 py-3 text-sm font-semibold text-[#667085] hover:text-[#003f7d]"
          }
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
