"use client";

import React from "react";
import { GlassCard } from "../ui/GlassCard";
import {
  UserPlus,
  BedDouble,
  Receipt,
  FileCheck,
  ArrowRight,
  ShieldCheck,
  CalendarCheck,
} from "lucide-react";

export interface QuickActionsProps {
  onAdmit: () => void;
  onReserve: () => void;
  onInterim: () => void;
  onDischarge: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAdmit,
  onReserve,
  onInterim,
  onDischarge,
}) => {
  const actions = [
    {
      id: "admit",
      title: "Simulate Admission",
      desc: "Execute ADMIT command with minimum deposit validation and bed allocation.",
      icon: <UserPlus className="w-5 h-5 text-[#38D9F5]" />,
      badge: "BR-02 Allocation",
      glow: "cyan" as const,
      onClick: onAdmit,
    },
    {
      id: "reserve",
      title: "Reserve Bed (6h Hold)",
      desc: "Reserve bed in requested category with automatic 6-hour expiration lock.",
      icon: <BedDouble className="w-5 h-5 text-[#9B87FF]" />,
      badge: "BR-12 Lifecycle",
      glow: "violet" as const,
      onClick: onReserve,
    },
    {
      id: "interim",
      title: "Audit Interim Bills",
      desc: "Trigger manual or 7-day automatic interim bill; inspect locked charge lines.",
      icon: <Receipt className="w-5 h-5 text-[#22C7A9]" />,
      badge: "BR-09 Locking",
      glow: "teal" as const,
      onClick: onInterim,
    },
    {
      id: "discharge",
      title: "Discharge & Settle",
      desc: "Execute final bill reconciliation, deposit refund, or balance collection gate.",
      icon: <FileCheck className="w-5 h-5 text-[#5685FF]" />,
      badge: "BR-10 Settlement",
      glow: "blue" as const,
      onClick: onDischarge,
    },
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#7E90A8]">
          Interactive Engine Simulation Actions
        </h3>
        <span className="text-xs text-[#38D9F5] font-mono">
          Demonstration Mode Active
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((act) => (
          <GlassCard
            key={act.id}
            variant="interactive"
            glowColor={act.glow}
            onClick={act.onClick}
            className="p-5 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/10 group-hover:scale-105 transition-transform">
                  {act.icon}
                </div>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-[#B6C4D5] border border-white/10">
                  {act.badge}
                </span>
              </div>

              <h4 className="text-sm font-semibold text-[#F3F7FC] group-hover:text-[#38D9F5] transition-colors">
                {act.title}
              </h4>
              <p className="text-xs text-[#7E90A8] mt-1.5 leading-relaxed">
                {act.desc}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-medium text-[#38D9F5]">
              <span>Run Simulation</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
