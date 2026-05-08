import type { ReactNode } from "react";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
};

export function PageShell({
  eyebrow = "강남구 도시환경국",
  title,
  description,
  actions,
  children,
  maxWidth = "max-w-6xl",
}: PageShellProps) {
  return (
    <main className="gov-page">
      <header className="gov-topbar">
        <div className={`mx-auto flex ${maxWidth} flex-wrap items-center justify-between gap-4 px-6 py-5`}>
          <div>
            <p className="text-sm font-semibold text-[#d7ecff]">{eyebrow}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-normal">{title}</h1>
            {description ? (
              <p className="mt-2 text-sm leading-6 text-[#e9f5ff]">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </header>
      <div className={`mx-auto ${maxWidth} px-6 py-6`}>{children}</div>
    </main>
  );
}
