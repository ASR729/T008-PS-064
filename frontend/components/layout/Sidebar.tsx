"use client";

import React from "react";
import { cn } from "../../lib/utils";
import { SidebarItem } from "./SidebarItem";
import { MOCK_NAVIGATION } from "../../lib/mock-data";
import {
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  ShieldCheck,
  X,
} from "lucide-react";

import { useToast } from "../ui/Toast";

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeNav: string;
  onSelectNav: (id: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenRulesModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeNav,
  onSelectNav,
  isMobileOpen,
  onCloseMobile,
  onOpenRulesModal,
}) => {
  const { addToast } = useToast();

  const handleNavClick = (item: { id: string; label: string; isComingSoon?: boolean }) => {
    if (item.isComingSoon) {
      addToast({
        title: `${item.label} Module`,
        description: `${item.label} is scheduled for subsequent development phases. Complete Phase 1 foundation is active.`,
        type: "info",
      });
    }
    onSelectNav(item.id);
    onCloseMobile();
  };
  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#07111F]/80 backdrop-blur-md lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#0B1728]/95 lg:bg-[#0B1728]/80 backdrop-blur-2xl border-r border-white/10 transition-all duration-300 shadow-2xl lg:shadow-none",
          isCollapsed ? "w-20" : "w-64",
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/[0.08] relative">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Glowing Logo Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#102137] to-[#07111F] border border-[#38D9F5]/40 flex items-center justify-center shrink-0 shadow-md shadow-[#38D9F5]/20">
              <Activity className="w-5 h-5 text-[#38D9F5] animate-pulse" />
            </div>

            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-bold text-sm tracking-tight text-[#F3F7FC]">
                    PS-064
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-[#38D9F5]/15 text-[#38D9F5] border border-[#38D9F5]/30">
                    T008
                  </span>
                </div>
                <span className="text-[11px] text-[#7E90A8] truncate font-medium">
                  Hospital Inpatient Engine
                </span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-[#7E90A8] hover:text-[#F3F7FC] hover:bg-white/[0.08] transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-[#7E90A8] hover:text-[#F3F7FC] hover:bg-white/[0.08]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {MOCK_NAVIGATION.map((group) => (
            <div key={group.groupName} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 pb-1 text-[10px] font-semibold tracking-wider uppercase text-[#7E90A8]">
                  {group.groupName}
                </div>
              )}
              {group.items.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  isActive={activeNav === item.id}
                  isCollapsed={isCollapsed}
                  onClick={() => handleNavClick(item)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Engine Compliance Card at Bottom */}
        <div className="p-3 border-t border-white/[0.08] bg-white/[0.015]">
          {!isCollapsed ? (
            <div className="rounded-xl bg-[#102137]/60 border border-white/10 p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#F3F7FC]">
                <ShieldCheck className="w-4 h-4 text-[#22C58B]" />
                <span>Deterministic Engine</span>
              </div>
              <p className="text-[11px] text-[#7E90A8] leading-relaxed">
                BR-01 to BR-12 active. Noon 12:00 & ICU 08:00 anchors synchronized.
              </p>
              <button
                type="button"
                onClick={onOpenRulesModal}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#38D9F5] hover:underline pt-0.5 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Inspect Engine Rules</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenRulesModal}
              className="w-full flex justify-center p-2 rounded-xl text-[#22C58B] hover:bg-white/[0.08] transition-colors"
              title="Inspect 12 Business Rules"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
