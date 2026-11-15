"use client";

import React, { useState } from "react";
import { cn } from "../../lib/utils";
import { Search, X } from "lucide-react";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  shortcut?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value: controlledValue,
  onChange,
  onClear,
  shortcut = "⌘K",
  placeholder = "Search admissions, beds, ledgers...",
  className,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState("");
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!isControlled) setInternalValue(val);
    onChange?.(val);
  };

  const handleClear = () => {
    if (!isControlled) setInternalValue("");
    onChange?.("");
    onClear?.();
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search className="absolute left-3 w-4 h-4 text-[#7E90A8] pointer-events-none" />

      <input
        type="text"
        value={currentValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full bg-[#07111F]/70 border border-white/12 hover:border-white/20 focus:border-[#38D9F5]/50 focus:ring-2 focus:ring-[#38D9F5]/20 rounded-xl pl-9 pr-14 py-2 text-xs sm:text-sm text-[#F3F7FC] placeholder-[#7E90A8] transition-all duration-200 outline-none backdrop-blur-md"
        {...props}
      />

      <div className="absolute right-2.5 flex items-center gap-1.5">
        {currentValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 rounded-md text-[#7E90A8] hover:text-[#F3F7FC] hover:bg-white/10 transition-colors"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : shortcut ? (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-[#7E90A8] bg-white/[0.05] border border-white/10 rounded">
            {shortcut}
          </kbd>
        ) : null}
      </div>
    </div>
  );
};
