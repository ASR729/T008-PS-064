"use client";

import React from "react";
import { cn } from "../../lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

export interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  className?: string;
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No records found in current view.",
  className,
}: ResponsiveTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-[#7E90A8] bg-white/[0.015] rounded-xl border border-white/[0.08]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("w-full overflow-x-auto rounded-xl border border-white/10", className)}>
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-[#102137]/80 border-b border-white/10 text-[#7E90A8] uppercase tracking-wider font-semibold text-[11px]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "py-3 px-4",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06] text-[#F3F7FC]">
          {data.map((item, index) => (
            <tr
              key={keyExtractor(item)}
              className={cn(
                "transition-colors hover:bg-white/[0.04]",
                index % 2 === 1 ? "bg-white/[0.015]" : "bg-transparent"
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "py-3 px-4 align-middle",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.className
                  )}
                >
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: "cyan" | "violet" | "warning";
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, badge, badgeVariant = "cyan", action, className }) => {
  const badgeStyles = {
    cyan: "bg-[#38D9F5]/10 text-[#38D9F5] border-[#38D9F5]/30",
    violet: "bg-[#9B87FF]/10 text-[#9B87FF] border-[#9B87FF]/30",
    warning: "bg-[#F5B942]/10 text-[#F5B942] border-[#F5B942]/30",
  };

  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4", className)}>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-[#F3F7FC] tracking-tight">
            {title}
          </h3>
          {badge && (
            <span
              className={cn(
                "text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wider",
                badgeStyles[badgeVariant]
              )}
            >
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-[#7E90A8] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
};
