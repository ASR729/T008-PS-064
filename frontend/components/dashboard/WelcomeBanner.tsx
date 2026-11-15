"use client";

import React, { useState, useEffect } from "react";
import { GlassCard } from "../ui/GlassCard";
import { Sparkles, ShieldCheck, Clock, Calendar, AlertCircle } from "lucide-react";
import { MOCK_DISCLAIMER } from "../../lib/mock-data";

export interface WelcomeBannerProps {
  onOpenRules: () => void;
  onOpenSimulate: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({
  onOpenRules,
  onOpenSimulate,
}) => {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      );
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <GlassCard
      variant="highlight"
      glowColor="cyan"
      className="p-6 sm:p-7 relative overflow-hidden mb-6"
    >
      {/* Background ambient lighting orbs */}
      <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#38D9F5]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#9B87FF]/10 blur-3xl" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#38D9F5]/15 border border-[#38D9F5]/30 text-xs font-semibold text-[#38D9F5]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>PS-064 Command Center</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#22C58B]/10 border border-[#22C58B]/30 text-[11px] font-medium text-[#22C58B]">
              <ShieldCheck className="w-3 h-3" />
              <span>Engine Status: Deterministic (BR-01–BR-12)</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#F3F7FC] tracking-tight">
            Inpatient Billing & Bed Management Engine
          </h1>

          <p className="text-xs sm:text-sm text-[#B6C4D5] leading-relaxed">
            Real-time simulation platform modeling hospital inpatient operations: admission validation, category-at-event tariff multipliers, ICU step-downs, 80% deposit top-up demands, and final discharge settlement.
          </p>

          <div className="flex items-center gap-2 pt-1 text-[11px] text-[#7E90A8]">
            <AlertCircle className="w-3.5 h-3.5 text-[#F5B942] shrink-0" />
            <span className="italic">{MOCK_DISCLAIMER}</span>
          </div>
        </div>

        {/* Live Synchronized Clocks & Anchor Indicators */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#07111F]/70 border border-white/10 backdrop-blur-md">
            <Calendar className="w-4 h-4 text-[#38D9F5]" />
            <span className="text-xs font-medium text-[#F3F7FC] font-mono">
              {currentDate || "16 Nov 2026"}
            </span>
            <span className="text-white/20">|</span>
            <Clock className="w-4 h-4 text-[#22C7A9]" />
            <span className="text-xs font-semibold text-[#38D9F5] font-mono tabular-nums">
              {currentTime || "12:00:00 PM"}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#7E90A8] font-mono">
            <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">
              Noon Anchor: <strong className="text-[#F3F7FC]">12:00:00</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">
              ICU Anchor: <strong className="text-[#F3F7FC]">08:00:00</strong>
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};
