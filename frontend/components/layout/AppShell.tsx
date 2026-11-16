"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ToastProvider } from "../ui/Toast";
import { cn } from "../../lib/utils";
import { BreadcrumbItem } from "./Breadcrumb";

export interface AppShellProps {
  children: (props: {
    activeNav: string;
    setActiveNav: (nav: string) => void;
    onOpenRulesModal: () => void;
  }) => React.ReactNode;
  currentPageTitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  onOpenRulesModal?: () => void;
  initialActiveNav?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  currentPageTitle = "Command Operations Dashboard",
  breadcrumbs = [{ label: "Operations" }, { label: "Command Center" }],
  initialActiveNav = "dashboard",
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeNav, setActiveNav] = useState(initialActiveNav);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Dispatches event or toggle handled elsewhere
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#07111F] text-[#F3F7FC] relative overflow-x-hidden flex flex-col">
        {/* Futuristic Ambient Lighting Glows */}
        <div className="pointer-events-none fixed inset-0 z-0 bg-ambient-mesh opacity-90" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-grid-pattern opacity-40" />

        {/* Sidebar */}
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
          activeNav={activeNav}
          onSelectNav={setActiveNav}
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
          onOpenRulesModal={() => setIsRulesModalOpen(true)}
        />

        {/* Main Application Column */}
        <div
          className={cn(
            "flex-1 flex flex-col transition-all duration-300 relative z-10",
            isCollapsed ? "lg:pl-20" : "lg:pl-64"
          )}
        >
          {/* Topbar */}
          <Topbar
            onOpenMobileSidebar={() => setIsMobileOpen(true)}
            currentPageTitle={currentPageTitle}
            breadcrumbs={breadcrumbs}
            onOpenRulesModal={() => setIsRulesModalOpen(true)}
          />

          {/* Main Content Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            {children({
              activeNav,
              setActiveNav,
              onOpenRulesModal: () => setIsRulesModalOpen(true),
            })}
          </main>

          {/* Minimalist Glass Footer */}
          <footer className="px-6 py-4 border-t border-white/[0.06] text-xs text-[#7E90A8] flex flex-col sm:flex-row items-center justify-between gap-2 bg-[#07111F]/60 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#B6C4D5]">PS-064 Capstone</span>
              <span>•</span>
              <span>Team T008</span>
              <span>•</span>
              <span>Hospital Inpatient Billing and Bed Management Engine</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-[#22C58B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C58B]" />
                Engine Compliant (BR-01–BR-12)
              </span>
              <span>•</span>
              <span>Simulation Mode</span>
            </div>
          </footer>
        </div>
      </div>
    </ToastProvider>
  );
};
