"use client";

import React, { useState } from "react";
import { GlassCard } from "../ui/GlassCard";
import { MOCK_ACTIVITIES } from "../../lib/mock-data";
import { ActivityEvent } from "../../types";
import { formatCurrency } from "../../lib/utils";
import {
  Activity,
  UserPlus,
  ArrowLeftRight,
  AlertTriangle,
  Receipt,
  CheckCircle2,
  FileCheck2,
  Stethoscope,
  Filter,
} from "lucide-react";
import { useToast } from "../ui/Toast";

export const ActivityFeed: React.FC = () => {
  const { addToast } = useToast();
  const [filter, setFilter] = useState<string>("ALL");

  const filtered = MOCK_ACTIVITIES.filter((act) => {
    if (filter === "ALL") return true;
    return act.eventType === filter;
  });

  const getEventIcon = (type: ActivityEvent["eventType"]) => {
    switch (type) {
      case "ADMIT":
        return <UserPlus className="w-3.5 h-3.5 text-[#22C58B]" />;
      case "TRANSFER":
        return <ArrowLeftRight className="w-3.5 h-3.5 text-[#38BDF8]" />;
      case "TOP_UP_DEMAND":
        return <AlertTriangle className="w-3.5 h-3.5 text-[#F5B942]" />;
      case "PROCEDURE":
        return <Stethoscope className="w-3.5 h-3.5 text-[#9B87FF]" />;
      case "INTERIM_BILL":
        return <Receipt className="w-3.5 h-3.5 text-[#5685FF]" />;
      case "HOUSEKEEPING_CLEARED":
        return <CheckCircle2 className="w-3.5 h-3.5 text-[#22C7A9]" />;
      case "DISCHARGE":
        return <FileCheck2 className="w-3.5 h-3.5 text-[#22C58B]" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-[#38D9F5]" />;
    }
  };

  return (
    <GlassCard variant="default" className="p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#22C7A9]/10 border border-[#22C7A9]/30 text-[#22C7A9]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-[#F3F7FC] tracking-tight">
                Simulated Operational Event Log
              </h3>
              <p className="text-xs text-[#7E90A8]">
                Real-time command stream (ADMIT, TRANSFER, PROCEDURE, DEMAND)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#07111F] p-1 rounded-xl border border-white/10 text-[11px]">
            {["ALL", "ADMIT", "TOP_UP_DEMAND", "PROCEDURE"].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  filter === cat
                    ? "bg-[#102137] text-[#38D9F5] font-semibold"
                    : "text-[#7E90A8] hover:text-[#F3F7FC]"
                }`}
              >
                {cat === "TOP_UP_DEMAND" ? "DEMANDS" : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Stream */}
        <div className="mt-4 space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                addToast({
                  title: item.title,
                  description: item.description,
                  type: item.severity === "critical" ? "error" : item.severity,
                });
              }}
              className="p-3 rounded-xl bg-[#102137]/40 hover:bg-[#102137]/75 border border-white/[0.08] hover:border-white/20 transition-all cursor-pointer flex items-start gap-3 group"
            >
              <div className="p-1.5 rounded-lg bg-white/[0.05] border border-white/10 shrink-0 mt-0.5">
                {getEventIcon(item.eventType)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#F3F7FC] group-hover:text-[#38D9F5] transition-colors truncate">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono text-[#7E90A8] shrink-0">
                    {item.timestamp}
                  </span>
                </div>

                <p className="text-[11px] text-[#B6C4D5] mt-0.5 leading-relaxed line-clamp-2">
                  {item.description}
                </p>

                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-[#7E90A8] font-mono">
                  <span>Patient: <strong className="text-[#F3F7FC]">{item.patientName}</strong></span>
                  {item.bedId && <span>• Bed {item.bedId}</span>}
                  {item.amount && (
                    <span className="text-[#38D9F5] ml-auto">
                      {formatCurrency(item.amount)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.08] text-[11px] text-[#7E90A8] flex items-center justify-between">
        <span>Click any event to inspect ledger command metadata</span>
        <span className="font-mono text-[#38D9F5]">Order Preserved</span>
      </div>
    </GlassCard>
  );
};
