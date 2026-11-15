"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { Search, Bed, Users, Receipt, Shield, ArrowRight } from "lucide-react";
import { MOCK_ADMISSIONS, MOCK_BED_CATEGORIES } from "../../lib/mock-data";
import { useToast } from "../ui/Toast";

export interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction?: (actionId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  const [query, setQuery] = useState("");
  const { addToast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  const filteredAdmissions = MOCK_ADMISSIONS.filter(
    (a) =>
      a.patientName.toLowerCase().includes(query.toLowerCase()) ||
      a.admissionNo.toLowerCase().includes(query.toLowerCase()) ||
      a.bedId.toLowerCase().includes(query.toLowerCase())
  );

  const filteredBeds = MOCK_BED_CATEGORIES.filter((b) =>
    b.displayName.toLowerCase().includes(query.toLowerCase())
  );

  const systemCommands = [
    { code: "ADMIT", desc: "Admit patient with deposit validation and bed allocation" },
    { code: "RESERVE_BED", desc: "Reserve a bed of requested category (6h expiration)" },
    { code: "TRANSFER", desc: "Transfer patient between categories (subject to transfer limit)" },
    { code: "STEP_DOWN", desc: "ICU step-down movement to regular category" },
    { code: "VISIT", desc: "Log doctor visit charge with daily category limit" },
    { code: "PROCEDURE", desc: "Procedure charge with BR-07 top-up gate check" },
    { code: "INTERIM_BILL", desc: "Manual or automatic 7-day interim billing cycle" },
    { code: "DISCHARGE", desc: "Final discharge settlement, deposit reconciliation, and refund" },
  ].filter(
    (c) =>
      c.code.toLowerCase().includes(query.toLowerCase()) ||
      c.desc.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Global Command & Entity Search"
      subtitle="Search simulated patients, admissions, beds, tariffs, and engine commands"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-[#38D9F5]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type patient name, admission ID, bed code, or engine command..."
            className="w-full bg-[#07111F]/80 border border-white/15 focus:border-[#38D9F5] focus:ring-2 focus:ring-[#38D9F5]/20 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#F3F7FC] placeholder-[#7E90A8] outline-none backdrop-blur-md"
          />
        </div>

        {/* Results Sections */}
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {/* Admissions */}
          <div>
            <div className="text-[11px] font-semibold text-[#7E90A8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#38D9F5]" />
              <span>Simulated Patients & Admissions ({filteredAdmissions.length})</span>
            </div>

            <div className="space-y-1.5">
              {filteredAdmissions.slice(0, 4).map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    addToast({
                      title: "Admission Selected",
                      description: `Selected ${a.patientName} (${a.admissionNo}) in Bed ${a.bedId}`,
                      type: "info",
                    });
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] transition-colors text-left cursor-pointer group"
                >
                  <div>
                    <div className="text-xs font-semibold text-[#F3F7FC] group-hover:text-[#38D9F5] transition-colors">
                      {a.patientName}
                    </div>
                    <div className="text-[10px] text-[#7E90A8] font-mono mt-0.5">
                      {a.admissionNo} • Bed {a.bedId} • {a.category}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#7E90A8] group-hover:text-[#38D9F5] transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Engine Commands */}
          <div>
            <div className="text-[11px] font-semibold text-[#7E90A8] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#22C7A9]" />
              <span>PS-064 Engine Commands ({systemCommands.length})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {systemCommands.slice(0, 6).map((c) => (
                <div
                  key={c.code}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-col gap-1"
                >
                  <span className="font-mono text-xs font-bold text-[#38D9F5]">
                    {c.code}
                  </span>
                  <span className="text-[10px] text-[#B6C4D5] leading-relaxed line-clamp-2">
                    {c.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
