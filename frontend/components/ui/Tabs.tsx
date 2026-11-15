"use client";

import React from "react";
import { cn } from "../../lib/utils";

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  size?: "sm" | "md";
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
  size = "md",
}) => {
  const sizeStyles = {
    sm: "px-3 py-1 text-xs rounded-lg gap-1.5",
    md: "px-4 py-1.5 text-sm rounded-xl gap-2",
  };

  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center p-1 rounded-2xl bg-[#07111F]/80 border border-white/10 backdrop-blur-xl overflow-x-auto max-w-full",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer whitespace-nowrap",
              sizeStyles[size],
              isActive
                ? "bg-[#102137] text-[#38D9F5] shadow-md border border-[#38D9F5]/30 shadow-[#38D9F5]/10"
                : "text-[#7E90A8] hover:text-[#F3F7FC] hover:bg-white/[0.04]"
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.2 rounded-full",
                  isActive
                    ? "bg-[#38D9F5]/20 text-[#38D9F5]"
                    : "bg-white/[0.08] text-[#B6C4D5]"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
