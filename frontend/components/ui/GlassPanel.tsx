"use client";

import React from "react";
import { cn } from "../../lib/utils";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  title,
  subtitle,
  headerAction,
  footer,
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "relative rounded-2xl bg-[#0B1728]/85 backdrop-blur-2xl border border-white/12 shadow-2xl shadow-black/70 overflow-hidden flex flex-col",
        className
      )}
      {...props}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-[#F3F7FC] tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#7E90A8] mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </div>
      )}

      <div className="p-6 flex-1 overflow-auto">{children}</div>

      {footer && (
        <div className="px-6 py-3.5 border-t border-white/[0.08] bg-white/[0.015] flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
};
