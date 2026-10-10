import type { ReactNode } from "react";

/** Page frame for every section: a header with title, optional subtitle and actions, then scrolling content. */
export default function SectionShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="h-full flex flex-col">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 px-8 pt-6 pb-5 border-b border-line">
        <div className="min-w-0 max-w-3xl">
          <h1 className="text-[22px] leading-tight font-semibold text-ink">{title}</h1>
          {subtitle && <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6">{children}</div>
    </div>
  );
}
