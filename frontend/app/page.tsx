"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "../components/layout/AppShell";
import { WelcomeBanner } from "../components/dashboard/WelcomeBanner";
import { MetricGrid } from "../components/dashboard/MetricGrid";
import { OccupancyVisualizer } from "../components/dashboard/OccupancyVisualizer";
import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import { QuickActions } from "../components/dashboard/QuickActions";
import { AdmissionsTable } from "../components/dashboard/AdmissionsTable";
import { EngineRulesDrawer } from "../components/dashboard/EngineRulesDrawer";
import { SimulateActionModal } from "../components/dashboard/SimulateActionModal";
import { Tabs } from "../components/ui/Tabs";
import { PageHeader } from "../components/layout/Breadcrumb";
import { PrimaryButton, SecondaryButton } from "../components/ui/PrimaryButton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { ShieldCheck, Plus, Layers } from "lucide-react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isRulesDrawerOpen, setIsRulesDrawerOpen] = useState(false);
  const [simulateType, setSimulateType] = useState<
    "ADMIT" | "RESERVE" | "INTERIM" | "DISCHARGE" | null
  >(null);

  const tabs = [
    { id: "overview", label: "Executive Command", badge: "Live" },
    { id: "census", label: "Bed Census & Occupancy", badge: "120" },
    { id: "admissions", label: "Inpatient Accounts", badge: "78" },
    { id: "events", label: "Operational Event Log" },
    { id: "rules", label: "Engine Traceability (BR-01–BR-12)" },
  ];

  return (
    <AppShell
      currentPageTitle="Executive Operations Center"
      breadcrumbs={[{ label: "Operations" }, { label: "Command Center" }]}
      onOpenRulesModal={() => setIsRulesDrawerOpen(true)}
    >
      {({ activeNav, setActiveNav, onOpenRulesModal }) => (
        <div className="space-y-6">
          {/* Top Page Header */}
          <PageHeader
            title="Hospital Operations & Billing Engine"
            subtitle="Real-time inpatient lifecycle simulation, category tariff multipliers, and financial reconciliation"
            badge={
              <StatusBadge
                status="available"
                label="Simulation Active"
                size="md"
              />
            }
            actions={
              <>
                <Link href="/hospital">
                  <SecondaryButton
                    size="sm"
                    icon={<Layers className="w-3.5 h-3.5 text-[#38D9F5]" />}
                  >
                    3D Hospital View
                  </SecondaryButton>
                </Link>
                <SecondaryButton
                  size="sm"
                  onClick={() => setIsRulesDrawerOpen(true)}
                  icon={<ShieldCheck className="w-3.5 h-3.5 text-[#22C58B]" />}
                >
                  Inspect BR-01–BR-12
                </SecondaryButton>
                <PrimaryButton
                  size="sm"
                  onClick={() => setSimulateType("ADMIT")}
                  icon={<Plus className="w-3.5 h-3.5" />}
                >
                  Simulate Admission
                </PrimaryButton>
              </>
            }
          />

          {/* Futuristic Welcome Banner with live synchronised anchors */}
          <WelcomeBanner
            onOpenRules={() => setIsRulesDrawerOpen(true)}
            onOpenSimulate={() => setSimulateType("ADMIT")}
          />

          {/* Interactive Quick Actions Bar */}
          <QuickActions
            onAdmit={() => setSimulateType("ADMIT")}
            onReserve={() => setSimulateType("RESERVE")}
            onInterim={() => setSimulateType("INTERIM")}
            onDischarge={() => setSimulateType("DISCHARGE")}
          />

          {/* View Selection Tabs */}
          <div className="flex items-center justify-between gap-4 overflow-x-auto pb-1">
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onChange={setActiveTab}
              size="md"
            />
            <div className="hidden md:flex items-center gap-2 text-xs text-[#7E90A8] font-mono shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#22C58B] animate-pulse" />
              <span>Decimal ROUND_HALF_UP Active</span>
            </div>
          </div>

          {/* TAB 1: EXECUTIVE COMMAND (DEFAULT FULL VIEW) */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Core Healthcare Metric Grid */}
              <MetricGrid />

              {/* Two-Column Layout: Bed Census Breakdown & Live Event Stream */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OccupancyVisualizer />
                <ActivityFeed />
              </div>

              {/* Inpatient Admissions & Accounts Table */}
              <AdmissionsTable />
            </div>
          )}

          {/* TAB 2: BED CENSUS ONLY */}
          {activeTab === "census" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <OccupancyVisualizer />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#102137]/50 border border-white/10 text-xs text-[#B6C4D5]">
                  <h4 className="font-semibold text-[#38D9F5] mb-1">General Ward Separation</h4>
                  <p className="leading-relaxed">
                    General Ward Male (35 beds) and Female (35 beds) strictly enforce gender parity under BR-02 allocation rules.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#102137]/50 border border-white/10 text-xs text-[#B6C4D5]">
                  <h4 className="font-semibold text-[#9B87FF] mb-1">ICU 08:00 Anchor & Step-Down</h4>
                  <p className="leading-relaxed">
                    ICU bed days transition at 08:00:00 AM instead of 12:00:00 noon. Transfers require formal clinical STEP_DOWN commands.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#102137]/50 border border-white/10 text-xs text-[#B6C4D5]">
                  <h4 className="font-semibold text-[#22C58B] mb-1">Housekeeping Clearance</h4>
                  <p className="leading-relaxed">
                    Beds vacated post-discharge enter sanitization hold. Available status restored strictly upon HOUSEKEEPING_CLEARED signal.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INPATIENTS ONLY */}
          {activeTab === "admissions" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <AdmissionsTable />
            </div>
          )}

          {/* TAB 4: EVENT LOG ONLY */}
          {activeTab === "events" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <ActivityFeed />
            </div>
          )}

          {/* TAB 5: ENGINE RULES SPECIFICATION */}
          {activeTab === "rules" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-6 rounded-2xl bg-[#102137]/60 border border-white/12 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
                  <div>
                    <h3 className="text-lg font-bold font-heading text-[#F3F7FC]">
                      Specification & Rules Compliance Overview
                    </h3>
                    <p className="text-xs text-[#7E90A8] mt-0.5">
                      PS-064 Capstone core business rules and edge-case handling architecture
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#22C58B]/10 text-[#22C58B] border border-[#22C58B]/30 text-xs font-semibold">
                    12 Rules Reconciled
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#B6C4D5]">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <span className="font-mono text-[#38D9F5] font-bold">BR-01 / BR-02: Anchors & Bed Allocation</span>
                    <p className="leading-relaxed">
                      Exact noon (12:00) anchor for general wards and 08:00 anchor for ICU. Multi-ward category assignment with 48h upgrade-free protection when assigned to higher category due to availability constraints.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <span className="font-mono text-[#5685FF] font-bold">BR-04 / BR-05: Event-Based Tariffs & Limits</span>
                    <p className="leading-relaxed">
                      Category-at-event principle guarantees charges reflect room occupied at timestamp. Doctor visits obey daily category quotas; intra-day repeat visits waive consultation fees.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <span className="font-mono text-[#F5B942] font-bold">BR-07: Deposit Lifecycle & 80% Demands</span>
                    <p className="leading-relaxed">
                      Top-up demand dispatched whenever cumulative net charges exceed 80% of current deposit. 48-hour payment deadline protects procedure scheduling.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <span className="font-mono text-[#22C58B] font-bold">BR-10 / BR-11: Final Settlement & GST Gates</span>
                    <p className="leading-relaxed">
                      Strict zero-balance gate for discharge authorization. 5% GST automatically levied on room charges strictly exceeding ₹5,000 threshold.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/[0.08] flex justify-end">
                  <PrimaryButton
                    onClick={() => setIsRulesDrawerOpen(true)}
                    icon={<ShieldCheck className="w-4 h-4" />}
                  >
                    Open Full Traceability Matrix
                  </PrimaryButton>
                </div>
              </div>
            </div>
          )}

          {/* Traceability Rules Modal */}
          <EngineRulesDrawer
            isOpen={isRulesDrawerOpen}
            onClose={() => setIsRulesDrawerOpen(false)}
          />

          {/* Simulated Action Execution Modal */}
          {simulateType && (
            <SimulateActionModal
              isOpen={Boolean(simulateType)}
              onClose={() => setSimulateType(null)}
              actionType={simulateType}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}
