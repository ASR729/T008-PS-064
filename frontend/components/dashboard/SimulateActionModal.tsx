"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { TextInput, SelectInput } from "../ui/TextInput";
import { PrimaryButton, SecondaryButton } from "../ui/PrimaryButton";
import { useToast } from "../ui/Toast";
import { UserPlus, BedDouble, Receipt, FileCheck, CheckCircle2, Sparkles } from "lucide-react";

export interface SimulateActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: "ADMIT" | "RESERVE" | "INTERIM" | "DISCHARGE";
}

export const SimulateActionModal: React.FC<SimulateActionModalProps> = ({
  isOpen,
  onClose,
  actionType,
}) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form states
  const [patientName, setPatientName] = useState("Demo Patient");
  const [category, setCategory] = useState("GENERAL_MALE");
  const [depositAmount, setDepositAmount] = useState("15000");
  const [paymentMode, setPaymentMode] = useState("CASH");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      onClose();

      if (actionType === "ADMIT") {
        addToast({
          title: "ADMIT Simulation Complete",
          description: `Simulated ADMIT for ${patientName} with deposit ₹${depositAmount} in ${category}. Bed allocated successfully.`,
          type: "success",
        });
      } else if (actionType === "RESERVE") {
        addToast({
          title: "RESERVE_BED Simulation Complete",
          description: `Bed reserved in category ${category} (6h expiration anchor set).`,
          type: "success",
        });
      } else if (actionType === "INTERIM") {
        addToast({
          title: "INTERIM_BILL Simulation Complete",
          description: "Simulated 7-day cycle interim bill generation. All billed events locked.",
          type: "info",
        });
      } else {
        addToast({
          title: "DISCHARGE Simulation Complete",
          description: "Patient discharge settlement calculated. Ledgers rounded with Decimal ROUND_HALF_UP.",
          type: "success",
        });
      }
    }, 700);
  };

  const titles = {
    ADMIT: "Simulate ADMIT Command",
    RESERVE: "Simulate RESERVE_BED Command",
    INTERIM: "Simulate INTERIM_BILL Command",
    DISCHARGE: "Simulate DISCHARGE Settlement",
  };

  const subtitles = {
    ADMIT: "Validates deposit amount against category tariff minimums and allocates available bed",
    RESERVE: "Reserves a bed in requested category with strict 6-hour lock",
    INTERIM: "Processes 7-day cycle or manual interim bill, locking past charge events",
    DISCHARGE: "Performs final ledger balancing, deposit reconciliation, and gate clearance",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titles[actionType]}
      subtitle={subtitles[actionType]}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {actionType === "ADMIT" && (
          <>
            <TextInput
              label="Patient Name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Ramesh K. Patel"
              required
            />

            <SelectInput
              label="Requested Bed Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: "GENERAL_MALE", label: "General Ward (Male) - ₹1,200/day" },
                { value: "GENERAL_FEMALE", label: "General Ward (Female) - ₹1,200/day" },
                { value: "SEMI_PRIVATE", label: "Semi-Private Ward - ₹2,800/day" },
                { value: "PRIVATE", label: "Private Suite - ₹5,500/day (GST applies)" },
                { value: "ICU", label: "ICU (8:00 anchor) - ₹8,500/day" },
              ]}
            />

            <TextInput
              label="Initial Deposit Amount (₹)"
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
              helperText="Rule BR-07: Minimum deposit must cover category daily base tariff"
            />

            <SelectInput
              label="Payment Mode"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              options={[
                { value: "CASH", label: "CASH" },
                { value: "CARD", label: "CARD (Credit / Debit)" },
                { value: "UPI", label: "UPI" },
                { value: "INSURANCE", label: "TPA / Insurance Pre-Auth" },
              ]}
            />
          </>
        )}

        {actionType === "RESERVE" && (
          <>
            <SelectInput
              label="Bed Category to Reserve"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={[
                { value: "GENERAL_MALE", label: "General Ward (Male)" },
                { value: "GENERAL_FEMALE", label: "General Ward (Female)" },
                { value: "SEMI_PRIVATE", label: "Semi-Private Ward" },
                { value: "PRIVATE", label: "Private Suite" },
                { value: "ICU", label: "ICU" },
              ]}
            />
            <p className="text-xs text-[#B6C4D5] bg-white/[0.04] p-3 rounded-xl border border-white/10 leading-relaxed">
              Under rule BR-12, bed reservations expire exactly 6 hours after reservation timestamp if patient admission is not executed.
            </p>
          </>
        )}

        {actionType === "INTERIM" && (
          <div className="space-y-2 text-xs text-[#B6C4D5]">
            <p className="p-3 rounded-xl bg-white/[0.04] border border-white/10 leading-relaxed">
              Interim bills are executed automatically on 7-day cycles (anchor 08:00:00 for ICU, 12:00:00 for wards).
            </p>
            <p className="text-[#7E90A8]">
              Once an interim bill is cut, all underlying charge events are locked. Any future revisions generate signed ADJ correction entries.
            </p>
          </div>
        )}

        {actionType === "DISCHARGE" && (
          <div className="space-y-2 text-xs text-[#B6C4D5]">
            <p className="p-3 rounded-xl bg-white/[0.04] border border-white/10 leading-relaxed">
              Final bill calculation enforces zero-balance payment gate. If deposit exceeds net charges, a refund line is generated. If net charges exceed deposit, payment is required prior to gate clearance.
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
          <SecondaryButton type="button" onClick={onClose} disabled={loading}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" loading={loading} icon={<Sparkles className="w-4 h-4" />}>
            Execute Simulation
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
};
