import { useState } from "react";

import type { RouteResponse } from "@/types/route";
import { cn } from "@/utils/ui";

interface RouteExecutorProps {
  route: RouteResponse | undefined;
  isComplete: boolean;
  isBuilding: boolean;
  isExecuting: boolean;
  onExecute: () => void;
  gasWarning?: string | null;
  slippage: string;
  onSlippageChange: (val: string) => void;
}

/**
 * Execute button with pre-flight checks (slippage, gas warnings).
 */
export function RouteExecutor({
  route,
  isComplete,
  isBuilding,
  isExecuting,
  onExecute,
  gasWarning,
  slippage,
  onSlippageChange,
}: RouteExecutorProps) {
  const [showSlippage, setShowSlippage] = useState(false);

  const canExecute = !!route && isComplete && !isBuilding && !isExecuting;

  return (
    <div className="space-y-3">
      {/* Slippage settings */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowSlippage(!showSlippage)}
          className="flex items-center gap-1 text-[11px] text-white/30 transition-colors hover:text-white/50"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="text-white/30"
          >
            <path
              d="M6 1.5V3M6 9V10.5M2.5 6H1M11 6H9.5M3.17 3.17L2.11 2.11M9.89 9.89L8.83 8.83M3.17 8.83L2.11 9.89M9.89 2.11L8.83 3.17"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <circle
              cx="6"
              cy="6"
              r="2"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
          Slippage: {slippage}%
        </button>
      </div>

      {showSlippage && (
        <div className="flex gap-2 rounded-xl border border-white/5 bg-white/[0.03] p-3">
          {["0.5", "1", "2", "3"].map((val) => (
            <button
              key={val}
              onClick={() => onSlippageChange(val)}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-xs transition-all",
                slippage === val
                  ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                  : "border border-white/5 bg-white/5 text-white/40 hover:bg-white/10",
              )}
            >
              {val}%
            </button>
          ))}
          <input
            type="text"
            value={slippage}
            onChange={(e) => {
              const val = e.target.value;
              if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                onSlippageChange(val);
              }
            }}
            className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center text-xs text-white focus:border-cyan-400/40 focus:outline-none"
            placeholder="Custom"
          />
        </div>
      )}

      {/* Gas warning */}
      {gasWarning && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-400/10 bg-yellow-400/5 px-3 py-2 text-[11px] text-yellow-300/70">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="mt-0.5 flex-shrink-0"
          >
            <path
              d="M7 1L13 12H1L7 1Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M7 5V8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle
              cx="7"
              cy="10"
              r="0.5"
              fill="currentColor"
            />
          </svg>
          <span>{gasWarning}</span>
        </div>
      )}

      {/* Execute button */}
      <button
        onClick={onExecute}
        disabled={!canExecute}
        className={cn(
          "w-full rounded-xl py-3.5 text-sm font-medium transition-all",
          canExecute
            ? "bg-gradient-to-r from-cyan-500 to-cyan-400 text-black shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-cyan-300 hover:shadow-cyan-400/30 active:scale-[0.98]"
            : "cursor-not-allowed border border-white/5 bg-white/5 text-white/20",
        )}
      >
        {isExecuting
          ? "Executing..."
          : isBuilding
            ? "Building Transaction..."
            : !route
              ? "Enter Route Details"
              : !isComplete
                ? "Provide All Addresses"
                : "Execute Route"}
      </button>

      {/* Smart Relay notice */}
      <p className="text-center text-[10px] text-white/20">
        Powered by Skip Smart Relay — no gas needed on intermediate chains
      </p>
    </div>
  );
}
