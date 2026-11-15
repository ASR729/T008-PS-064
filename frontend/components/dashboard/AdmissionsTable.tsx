"use client";

import React, { useState } from "react";
import { GlassCard } from "../ui/GlassCard";
import { ResponsiveTable, Column } from "../ui/ResponsiveTable";
import { StatusBadge } from "../ui/StatusBadge";
import { SearchInput } from "../ui/SearchInput";
import { MOCK_ADMISSIONS } from "../../lib/mock-data";
import { DemoAdmission } from "../../types";
import { formatCurrency } from "../../lib/utils";
import { UserCheck, AlertTriangle, ArrowRight, Eye, ShieldCheck } from "lucide-react";
import { useToast } from "../ui/Toast";

export interface AdmissionsTableProps {
  onSelectAdmission?: (admission: DemoAdmission) => void;
}

export const AdmissionsTable: React.FC<AdmissionsTableProps> = ({
  onSelectAdmission,
}) => {
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const filtered = MOCK_ADMISSIONS.filter((item) => {
    const matchesSearch =
      item.patientName.toLowerCase().includes(search.toLowerCase()) ||
      item.admissionNo.toLowerCase().includes(search.toLowerCase()) ||
      item.bedId.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "ALL" || item.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const columns: Column<DemoAdmission>[] = [
    {
      key: "admissionNo",
      header: "Admission ID",
      render: (item) => (
        <span className="font-mono font-semibold text-[#38D9F5] whitespace-nowrap">
          {item.admissionNo}
        </span>
      ),
    },
    {
      key: "patientName",
      header: "Patient Details",
      render: (item) => (
        <div className="min-w-[130px]">
          <div className="font-semibold text-[#F3F7FC] whitespace-nowrap">{item.patientName}</div>
          <div className="text-[11px] text-[#7E90A8] whitespace-nowrap">
            {item.age} yrs • {item.gender === "M" ? "Male" : "Female"}
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Ward / Category",
      render: (item) => (
        <div className="min-w-[120px]">
          <span className="text-xs font-medium text-[#B6C4D5] whitespace-nowrap">
            {item.category.replace("_", " ")}
          </span>
          <div className="text-[11px] font-mono text-[#7E90A8] whitespace-nowrap">
            Bed: <strong className="text-[#F3F7FC]">{item.bedId}</strong>
          </div>
        </div>
      ),
    },
    {
      key: "initialDeposit",
      header: "Initial Deposit",
      align: "right",
      render: (item) => (
        <span className="font-mono text-[#F3F7FC] whitespace-nowrap">
          {formatCurrency(item.initialDeposit)}
        </span>
      ),
    },
    {
      key: "currentCharges",
      header: "Net Charges",
      align: "right",
      render: (item) => (
        <span className="font-mono text-[#B6C4D5] whitespace-nowrap">
          {formatCurrency(item.currentCharges)}
        </span>
      ),
    },
    {
      key: "balance",
      header: "Available Balance",
      align: "right",
      render: (item) => (
        <span
          className={`font-mono font-semibold whitespace-nowrap ${
            item.balance < 0 ? "text-[#F06474]" : "text-[#22C58B]"
          }`}
        >
          {formatCurrency(item.balance)}
        </span>
      ),
    },
    {
      key: "threshold80Exceeded",
      header: "Top-Up Gate",
      align: "center",
      render: (item) => (
        <div className="whitespace-nowrap">
          {item.threshold80Exceeded ? (
            <StatusBadge
              status="critical"
              label=">80% Demand"
              size="sm"
            />
          ) : (
            <StatusBadge
              status="available"
              label="Buffer OK"
              size="sm"
            />
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (item) => {
        const statusMap: Record<string, "success" | "info" | "warning" | "critical"> = {
          ADMITTED: "success",
          TRANSFERRED: "info",
          PENDING_DISCHARGE: "warning",
          DISCHARGED: "success",
          ICU_STEPDOWN_NEEDED: "critical",
        };
        return (
          <div className="whitespace-nowrap">
            <StatusBadge
              status={statusMap[item.status] || "neutral"}
              label={item.status.replace("_", " ")}
              size="sm"
            />
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (item) => (
        <button
          onClick={() => {
            addToast({
              title: `Inspecting ${item.admissionNo}`,
              description: `Patient ${item.patientName} currently in bed ${item.bedId}. Balance: ${formatCurrency(item.balance)}.`,
              type: "info",
            });
            onSelectAdmission?.(item);
          }}
          className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] text-[#B6C4D5] hover:text-[#38D9F5] border border-white/10 transition-colors cursor-pointer"
          title="Inspect patient ledger"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <GlassCard variant="default" className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] mb-4">
        <div>
          <h3 className="text-base font-semibold text-[#F3F7FC] tracking-tight">
            Active Admissions & Financial Balances
          </h3>
          <p className="text-xs text-[#7E90A8]">
            Demonstration view of active inpatient accounts and deposit threshold gates
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Filter by name, ID, or bed..."
            className="w-full sm:w-64"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#07111F] text-xs text-[#F3F7FC] border border-white/12 rounded-xl px-2.5 py-2 outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="GENERAL_MALE">General Male</option>
            <option value="GENERAL_FEMALE">General Female</option>
            <option value="SEMI_PRIVATE">Semi-Private</option>
            <option value="PRIVATE">Private</option>
            <option value="ICU">ICU</option>
          </select>
        </div>
      </div>

      <ResponsiveTable
        columns={columns}
        data={filtered}
        keyExtractor={(item) => item.id}
        emptyMessage="No active admissions match your search query."
      />
    </GlassCard>
  );
};
