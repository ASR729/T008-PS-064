"use client";

import React, { useState } from "react";
import { Breadcrumb, BreadcrumbItem } from "./Breadcrumb";
import { UserProfileMenu } from "./UserProfileMenu";
import { IconButton } from "../ui/IconButton";
import { NotificationsModal } from "./NotificationsModal";
import { SearchModal } from "./SearchModal";
import { Bell, Search, Menu, Sparkles, ShieldCheck } from "lucide-react";
import { MOCK_NOTIFICATIONS } from "../../lib/mock-data";

export interface TopbarProps {
  onOpenMobileSidebar: () => void;
  currentPageTitle: string;
  breadcrumbs: BreadcrumbItem[];
  onOpenRulesModal: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileSidebar,
  currentPageTitle,
  breadcrumbs,
  onOpenRulesModal,
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <>
      <header className="h-16 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 bg-[#07111F]/80 backdrop-blur-xl border-b border-white/[0.08]">
        {/* Left Section: Mobile trigger & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-[#7E90A8] hover:text-[#F3F7FC] hover:bg-white/[0.06] transition-colors"
            title="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <Breadcrumb items={breadcrumbs} />
            <h2 className="text-sm font-semibold text-[#F3F7FC] tracking-tight hidden sm:block">
              {currentPageTitle}
            </h2>
          </div>
        </div>

        {/* Right Section: Global search, Engine Rules pill, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Search Trigger */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-[#7E90A8] hover:text-[#F3F7FC] transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5 text-[#38D9F5]" />
            <span className="hidden md:inline">Quick search engine...</span>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[10px] font-mono text-[#7E90A8] bg-white/[0.06] border border-white/10 rounded">
              ⌘K
            </kbd>
          </button>

          {/* Engine Status Chip */}
          <button
            type="button"
            onClick={onOpenRulesModal}
            className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#22C58B]/10 hover:bg-[#22C58B]/15 border border-[#22C58B]/30 text-[11px] font-medium text-[#22C58B] transition-colors cursor-pointer"
            title="Inspect 12 Hospital Engine Rules"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>12 Rules Active</span>
          </button>

          {/* Notifications Trigger */}
          <IconButton
            label="System Notifications"
            badgeCount={unreadCount}
            variant="glass"
            size="md"
            onClick={() => setIsNotificationsOpen(true)}
          >
            <Bell className="w-4 h-4 text-[#B6C4D5]" />
          </IconButton>

          {/* User Profile Popover */}
          <UserProfileMenu />
        </div>
      </header>

      {/* Modals triggered from Topbar */}
      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};
