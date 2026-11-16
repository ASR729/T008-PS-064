"use client";

import React from "react";
import Link from "next/link";
import { GlassCard } from "../ui/GlassCard";
import { MOCK_BED_CATEGORIES } from "../../lib/mock-data";
import { formatCurrency } from "../../lib/utils";
import { Bed, ShieldAlert, Layers, ArrowRight } from "lucide-react";

export const OccupancyVisualizer: React.FC = () => {
  const totalBeds = MOCK_BED_CATEGORIES.reduce((acc, cat) => acc + cat.total, 0);
  const totalOccupied = MOCK_BED_CATEGORIES.reduce((acc, cat) => acc + cat.occupied, 0);
  const totalAvailable = MOCK_BED_CATEGORIES.reduce((acc, cat) => acc + cat.available, 0);
  const overallOccupancyPct = Math.round((totalOccupied / totalBeds) * 100);

  return (
    <GlassCard variant="default" className="p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#38D9F5]/10 border border-[#38D9F5]/30 text-[#38D9F5]">
              <Bed className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-[#F3F7FC] tracking-tight">
                Bed Census & Category Occupancy
              </h3>
              <p className="text-xs text-[#7E90A8]">
                Real-time allocation across 5 clinical inpatient categories
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xl font-bold font-mono text-[#38D9F5]">
              {overallOccupancyPct}%
            </span>
            <div className="text-[11px] text-[#7E90A8]">
              {totalOccupied} / {totalBeds} Beds Occupied
            </div>
          </div>
        </div>

        {/* Category Breakdown Bars */}
        <div className="mt-5 space-y-4">
          {MOCK_BED_CATEGORIES.map((cat) => {
            const occupancyPct = Math.round((cat.occupied / cat.total) * 100);

            return (
              <div
                key={cat.category}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 hover:border-white/15 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#F3F7FC]">
                      {cat.displayName}
                    </span>
                    {cat.genderRule === "MALE_ONLY" && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30">
                        Male
                      </span>
                    )}
                    {cat.genderRule === "FEMALE_ONLY" && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#22C7A9]/15 text-[#22C7A9] border border-[#22C7A9]/30">
                        Female
                      </span>
                    )}
                    {cat.category === "ICU" && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#F06474]/15 text-[#F06474] border border-[#F06474]/30">
                        08:00 Anchor
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-[#7E90A8] ml-auto">
                    {formatCurrency(cat.dailyRate)}/day
                  </span>
                </div>

                {/* Multi-segment Progress Bar */}
                <div className="h-2 w-full bg-[#07111F] rounded-full overflow-hidden flex border border-white/[0.08] p-0.5">
                  <div
                    style={{ width: `${occupancyPct}%`, backgroundColor: cat.color }}
                    className="h-full rounded-full transition-all duration-500 shadow-sm"
                  />
                </div>

                {/* Sub-metrics */}
                <div className="flex items-center justify-between text-[11px] font-mono text-[#B6C4D5]">
                  <span className="text-[#22C58B]">
                    {cat.available} Available
                  </span>
                  <span className="text-[#38D9F5]">
                    {cat.occupied} Occupied ({occupancyPct}%)
                  </span>
                  <span className="text-[#7E90A8]">
                    Cap: {cat.total}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rules Notice Badge & 3D Explorer Button at Bottom */}
      <div className="mt-5 pt-3.5 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#7E90A8]">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-[#F5B942]" />
          <span>BR-02: Upgrade-Free window active for fallback bed allocations</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[#22C58B]">{totalAvailable} Beds Ready</span>
          <span className="text-white/20">•</span>
          <Link
            href="/hospital"
            className="inline-flex items-center gap-1 text-[#38D9F5] hover:underline font-semibold"
          >
            <Layers className="w-3 h-3" />
            <span>Interactive 3D</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </GlassCard>
  );
};
