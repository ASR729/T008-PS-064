"use client";

import React from "react";
import { cn } from "../../lib/utils";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  className,
}) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1.5 text-xs text-[#7E90A8]", className)}
    >
      <div className="flex items-center gap-1 text-[#B6C4D5]">
        <Home className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">PS-064</span>
      </div>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight
              className={cn(
                "w-3 h-3 text-white/20 shrink-0",
                !isLast && "hidden sm:inline-block"
              )}
            />
            <span
              className={cn(
                "truncate font-medium",
                isLast
                  ? "text-[#F3F7FC] max-w-[130px] sm:max-w-none"
                  : "hidden sm:inline text-[#7E90A8] hover:text-[#B6C4D5]"
              )}
            >
              {item.label}
            </span>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  actions,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]",
        className
      )}
    >
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold font-heading text-[#F3F7FC] tracking-tight">
            {title}
          </h1>
          {badge}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#7E90A8] mt-1">{subtitle}</p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
};
