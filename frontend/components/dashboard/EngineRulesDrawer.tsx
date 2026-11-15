"use client";

import React from "react";
import { Modal } from "../ui/Modal";
import { ShieldCheck, CheckCircle2, AlertTriangle, FileText, ArrowRight } from "lucide-react";

export interface EngineRulesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EngineRulesDrawer: React.FC<EngineRulesDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const rules = [
    {
      id: "BR-01",
      title: "Bed-Day Counting & Anchors",
      desc: "Noon anchor 12:00 for general beds; 08:00 anchor for ICU. Discharge boundary rules enforce exact length-of-stay day counting.",
      edgeCase: "EC-01 (Noon Admission), EC-02 (14:00 Discharge), EC-03 (23h59m Stay)",
      status: "PASS (Reconciled)",
    },
    {
      id: "BR-02",
      title: "Bed Allocation & Upgrade-Free Window",
      desc: "Category availability and gender restrictions enforced. Fallback bed upgrade is upgrade-free for a strict 48-hour window.",
      edgeCase: "EC-04 (Upgrade-Free 48h boundary)",
      status: "PASS (Reconciled)",
    },
    {
      id: "BR-03",
      title: "Category Transfers & ICU Step-Down",
      desc: "Transfers between wards adhere to category limits; STEP_DOWN command required for safe ICU exit.",
      status: "PASS (Reconciled)",
    },
    {
      id: "BR-04",
      title: "Category-at-Event Tariff Multipliers",
      desc: "Charges calculated using category occupied at event timestamp, strictly independent of subsequent transfers.",
      status: "PASS (Reconciled)",
    },
    {
      id: "BR-05",
      title: "Doctor Visit Charging & Daily Limits",
      desc: "Doctor visit fees scaled by category multiplier. Daily visit limits enforced per category; repeat visits within same day are free.",
      status: "PASS (Reconciled)",
    },
    {
      id: "BR-06",
      title: "Package Management & ICU Conversion",
      desc: "Covers procedures, inclusions, exclusions, and LOS. When ICU stay exceeds 48 hours, package automatically converts with REPRICE lines.",
      edgeCase: "EC-05 (ICU > 48h Package conversion)",
      status: "PASS (Reconciled)",
    },
    {
      id: "BR-07",
      title: "Deposits & Top-Up Demand Lifecycle",
      desc: "When net charges exceed 80% of deposit (strictly greater), a top-up demand is triggered with a 48h payment deadline.",
      edgeCase: "EC-06 (80% threshold boundary check)",
      status: "PASS (Reconciled)",
    },
    {
      id: "BR-07a / 07b",
      title: "Procedure Blocking & Emergency Exemption",
      desc: "Non-emergency procedures blocked if top-up demand unpaid past 48h. Emergency procedures permitted with audit flag.",
      status: "PASS (Reconciled)",
    },
    {
      id: "BR-08",
      title: "Discount Policies",
      desc: "Senior Citizen (10% bed/nursing), Employee Referral (15% doctor fees), Charity (up to 50% with verified CEO reference).",
      status: "PASS (Reconciled)",
    },
    {
      id: "BR-09",
      title: "Interim Billing & Locked-Event Corrections",
      desc: "Manual and automatic 7-day interim billing cycles. Once billed, events are locked; subsequent corrections require signed ADJ lines.",
      edgeCase: "EC-08 (Locked-event correction)",
      status: "PASS (Reconciled)",
    },
    {
      id: "BR-10",
      title: "Final Discharge Settlement & Gate",
      desc: "Decimal ROUND_HALF_UP rounding. Gate check verifies balance due zero before discharge authorization; refunds computed.",
      status: "PASS (Reconciled)",
    },
    {
      id: "BR-11",
      title: "GST Room Charge Calculation",
      desc: "5% GST applied strictly to room charges strictly exceeding ₹5,000/day. Applies to BED charge events only.",
      edgeCase: "EC-07 (₹5,000 GST boundary)",
      status: "PASS (Reconciled)",
    },
    {
      id: "BR-12",
      title: "Bed Lifecycle, Reservations & Housekeeping",
      desc: "Bed reservations hold for 6 hours. Post-discharge beds enter HOUSEKEEPING until HOUSEKEEPING_CLEARED command arrives.",
      status: "PASS (Reconciled)",
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="PS-064 Business Rules Traceability Matrix"
      subtitle="Complete specification coverage (BR-01 to BR-12, EC-01 to EC-08) — 100% matched"
      maxWidth="2xl"
    >
      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="p-3.5 rounded-xl bg-[#102137]/40 border border-white/10 flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#38D9F5]">
                  {rule.id}
                </span>
                <span className="text-xs font-semibold text-[#F3F7FC]">
                  {rule.title}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#22C58B]/10 text-[#22C58B] border border-[#22C58B]/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>{rule.status}</span>
              </span>
            </div>

            <p className="text-xs text-[#B6C4D5] leading-relaxed">
              {rule.desc}
            </p>

            {rule.edgeCase && (
              <div className="text-[11px] text-[#F5B942] font-mono flex items-center gap-1.5 mt-0.5">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Edge Cases: {rule.edgeCase}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
};
