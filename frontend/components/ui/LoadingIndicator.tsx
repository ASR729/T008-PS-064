"use client";

import React from "react";
import { cn } from "../../lib/utils";
import { AlertCircle, RefreshCw, FolderSearch } from "lucide-react";
import { PrimaryButton } from "./PrimaryButton";

export const LoadingIndicator: React.FC<{
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}> = ({ size = "md", text = "Syncing Engine...", className }) => {
  const sizeMap = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-[2.5px]",
    lg: "w-12 h-12 border-3",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-6 gap-3", className)}>
      <div
        className={cn(
          "rounded-full border-t-[#38D9F5] border-r-transparent border-b-[#22C7A9] border-l-transparent animate-spin shadow-lg shadow-[#38D9F5]/20",
          sizeMap[size]
        )}
      />
      {text && <span className="text-xs text-[#7E90A8] font-mono tracking-wider">{text}</span>}
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}> = ({ title, description, icon, action, className }) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center flex flex-col items-center justify-center gap-3",
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#7E90A8]">
        {icon || <FolderSearch className="w-6 h-6" />}
      </div>
      <h4 className="text-sm font-semibold text-[#F3F7FC]">{title}</h4>
      <p className="text-xs text-[#7E90A8] max-w-sm leading-relaxed">{description}</p>
      {action && (
        <PrimaryButton size="sm" onClick={action.onClick} className="mt-2">
          {action.label}
        </PrimaryButton>
      )}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}> = ({ title = "Engine Validation Issue", message, onRetry, className }) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#F06474]/30 bg-[#F06474]/05 p-6 flex items-start gap-4",
        className
      )}
    >
      <AlertCircle className="w-5 h-5 text-[#F06474] shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-[#F06474]">{title}</h4>
        <p className="text-xs text-[#B6C4D5] mt-1 leading-relaxed">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#F3F7FC] hover:text-[#38D9F5] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Operation</span>
          </button>
        )}
      </div>
    </div>
  );
};
