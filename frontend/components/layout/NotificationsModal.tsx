"use client";

import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { Modal } from "../ui/Modal";
import { MOCK_NOTIFICATIONS } from "../../lib/mock-data";
import { NotificationItem } from "../../types";
import { Bell, CheckCheck, AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { StatusBadge } from "../ui/StatusBadge";

export interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAll?: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<"ALL" | "DEMAND" | "BED" | "SYSTEM">("ALL");

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filtered = notifications.filter((n) => {
    if (filter === "ALL") return true;
    return n.category === filter;
  });

  const severityIcon = {
    critical: <AlertTriangle className="w-4 h-4 text-[#F06474]" />,
    warning: <AlertTriangle className="w-4 h-4 text-[#F5B942]" />,
    success: <CheckCircle2 className="w-4 h-4 text-[#22C58B]" />,
    info: <Info className="w-4 h-4 text-[#38D9F5]" />,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="System & Clinical Notifications"
      subtitle={`${unreadCount} unread engine alerts and lifecycle signals`}
      maxWidth="md"
      footer={
        <button
          onClick={markAllAsRead}
          className="text-xs text-[#38D9F5] hover:underline flex items-center gap-1 cursor-pointer font-medium"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Mark all as read</span>
        </button>
      }
    >
      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 pb-3 border-b border-white/[0.08] mb-3 overflow-x-auto">
        {(["ALL", "DEMAND", "BED", "SYSTEM"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer",
              filter === tab
                ? "bg-[#102137] text-[#38D9F5] border border-[#38D9F5]/30"
                : "text-[#7E90A8] hover:text-[#F3F7FC] hover:bg-white/[0.05]"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={cn(
              "p-3 rounded-xl border transition-all flex items-start gap-3",
              item.read
                ? "bg-white/[0.02] border-white/[0.06] opacity-75"
                : "bg-[#102137]/60 border-white/12 shadow-sm"
            )}
          >
            <span className="mt-0.5">{severityIcon[item.severity]}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold text-[#F3F7FC] truncate">
                  {item.title}
                </h4>
                <span className="text-[10px] text-[#7E90A8] shrink-0 font-mono">
                  {item.timestamp}
                </span>
              </div>
              <p className="text-[11px] text-[#B6C4D5] mt-1 leading-relaxed">
                {item.message}
              </p>
            </div>
            {!item.read && (
              <span className="w-2 h-2 rounded-full bg-[#38D9F5] shadow-sm shadow-[#38D9F5] shrink-0 mt-1" />
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
};
