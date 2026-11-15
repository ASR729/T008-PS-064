"use client";

import React from "react";
import { cn } from "../../lib/utils";
import { Tooltip } from "../ui/Tooltip";
import {
  LayoutDashboard,
  Layers,
  BedDouble,
  Users,
  UserPlus,
  ArrowLeftRight,
  Receipt,
  PackageCheck,
  CreditCard,
  FileSpreadsheet,
  Sliders,
  LucideIcon,
} from "lucide-react";
import { NavItem } from "../../types";

const navIcons: Record<string, LucideIcon> = {
  LayoutDashboard,
  Layers,
  BedDouble,
  Users,
  UserPlus,
  ArrowLeftRight,
  Receipt,
  PackageCheck,
  CreditCard,
  FileSpreadsheet,
  Sliders,
};

export interface SidebarItemProps {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  isActive,
  isCollapsed,
  onClick,
}) => {
  const IconComponent = navIcons[item.icon] || LayoutDashboard;

  const badgeStyles = {
    cyan: "bg-[#38D9F5]/20 text-[#38D9F5] border-[#38D9F5]/30",
    warning: "bg-[#F5B942]/20 text-[#F5B942] border-[#F5B942]/30",
    critical: "bg-[#F06474]/20 text-[#F06474] border-[#F06474]/30",
    neutral: "bg-white/[0.08] text-[#B6C4D5] border-white/10",
    violet: "bg-[#9B87FF]/20 text-[#9B87FF] border-[#9B87FF]/30",
  };

  const content = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full flex items-center rounded-xl transition-all duration-200 cursor-pointer text-left select-none",
        isCollapsed ? "justify-center p-2.5" : "px-3 py-2 gap-3",
        isActive
          ? "bg-gradient-to-r from-[#102137] to-[#162c48]/60 text-[#38D9F5] border border-[#38D9F5]/30 shadow-md shadow-[#38D9F5]/10 font-semibold"
          : "text-[#B6C4D5] hover:text-[#F3F7FC] hover:bg-white/[0.05] border border-transparent"
      )}
    >
      {/* Active Indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#38D9F5] shadow-sm shadow-[#38D9F5]" />
      )}

      <IconComponent
        className={cn(
          "w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
          isActive ? "text-[#38D9F5]" : "text-[#7E90A8] group-hover:text-[#F3F7FC]"
        )}
      />

      {!isCollapsed && (
        <div className="flex-1 flex items-center justify-between min-w-0">
          <span className="text-xs truncate">{item.label}</span>
          {item.badge && (
            <span
              className={cn(
                "text-[10px] font-mono px-1.5 py-0.2 rounded-full border",
                badgeStyles[item.badgeVariant || "neutral"]
              )}
            >
              {item.badge}
            </span>
          )}
        </div>
      )}
    </button>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={item.label} position="right">
        {content}
      </Tooltip>
    );
  }

  return content;
};
