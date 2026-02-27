import { useState } from "react";

import type { AssetInfo } from "@/types/route";
import { cn } from "@/utils/ui";

import { ChainAssetSearch } from "./ChainAssetSearch";

export interface SelectedAsset {
  chainId: string;
  asset: AssetInfo;
}

interface AssetSelectorProps {
  source: SelectedAsset | null;
  dest: SelectedAsset | null;
  amountIn: string;
  onSourceSelect: (chainId: string, asset: AssetInfo) => void;
  onDestSelect: (chainId: string, asset: AssetInfo) => void;
  onAmountChange: (amount: string) => void;
  onSwap: () => void;
  estimatedOut?: string;
  isLoadingRoute?: boolean;
}

export function AssetSelector({
  source,
  dest,
  amountIn,
  onSourceSelect,
  onDestSelect,
  onAmountChange,
  onSwap,
  estimatedOut,
  isLoadingRoute,
}: AssetSelectorProps) {
  const [searchOpen, setSearchOpen] = useState<"source" | "dest" | null>(null);

  return (
    <div className="space-y-1">
      {/* Source */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">From</label>
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={() => setSearchOpen("source")}
            className={cn(
              "flex min-w-[140px] items-center gap-2 rounded-xl border px-3 py-2 transition-all",
              source
                ? "border-white/10 bg-white/5 hover:bg-white/10"
                : "border-cyan-400/30 bg-cyan-400/5 text-cyan-300 hover:bg-cyan-400/10",
            )}
          >
            {source ? (
              <>
                {source.asset.logo_uri && (
                  <img
                    src={source.asset.logo_uri}
                    alt=""
                    className="h-6 w-6 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-white">
                  {source.asset.recommended_symbol ?? source.asset.symbol ?? source.asset.denom}
                </span>
                <ChevronDown />
              </>
            ) : (
              <>
                <span className="text-sm">Select token</span>
                <ChevronDown />
              </>
            )}
          </button>

          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amountIn}
            onChange={(e) => {
              const val = e.target.value;
              if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                onAmountChange(val);
              }
            }}
            className="flex-1 bg-transparent text-right text-2xl font-medium text-white placeholder:text-white/20 focus:outline-none"
          />
        </div>
        {source && (
          <p className="mt-1.5 text-[11px] capitalize text-white/30">on {source.chainId.replace(/-\d+$/, "")}</p>
        )}
      </div>

      {/* Swap button */}
      <div className="relative z-10 -my-3 flex justify-center">
        <button
          onClick={onSwap}
          className="group flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#0a0a0f] transition-all hover:border-cyan-400/40 hover:bg-cyan-400/5"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="text-white/50 transition-colors group-hover:text-cyan-300"
          >
            <path
              d="M7 1V13M7 13L3 9M7 13L11 9M7 1L3 5M7 1L11 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Destination */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <label className="text-[11px] font-medium uppercase tracking-wider text-white/40">To</label>
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={() => setSearchOpen("dest")}
            className={cn(
              "flex min-w-[140px] items-center gap-2 rounded-xl border px-3 py-2 transition-all",
              dest
                ? "border-white/10 bg-white/5 hover:bg-white/10"
                : "border-cyan-400/30 bg-cyan-400/5 text-cyan-300 hover:bg-cyan-400/10",
            )}
          >
            {dest ? (
              <>
                {dest.asset.logo_uri && (
                  <img
                    src={dest.asset.logo_uri}
                    alt=""
                    className="h-6 w-6 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-white">
                  {dest.asset.recommended_symbol ?? dest.asset.symbol ?? dest.asset.denom}
                </span>
                <ChevronDown />
              </>
            ) : (
              <>
                <span className="text-sm">Select token</span>
                <ChevronDown />
              </>
            )}
          </button>

          <div className="flex-1 text-right text-2xl font-medium text-white/50">
            {isLoadingRoute ? (
              <span className="inline-block h-7 w-20 animate-pulse rounded-lg bg-white/5" />
            ) : estimatedOut ? (
              formatDisplayAmount(estimatedOut)
            ) : (
              <span className="text-white/20">0.00</span>
            )}
          </div>
        </div>
        {dest && <p className="mt-1.5 text-[11px] capitalize text-white/30">on {dest.chainId.replace(/-\d+$/, "")}</p>}
      </div>

      {/* Search modals */}
      <ChainAssetSearch
        isOpen={searchOpen === "source"}
        onClose={() => setSearchOpen(null)}
        onSelect={onSourceSelect}
        title="Select Source"
      />
      <ChainAssetSearch
        isOpen={searchOpen === "dest"}
        onClose={() => setSearchOpen(null)}
        onSelect={onDestSelect}
        title="Select Destination"
      />
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────

function ChevronDown() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      className="ml-auto text-white/40"
    >
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatDisplayAmount(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return "0.00";
  if (num < 0.01) return "<0.01";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(2) + "K";
  return num.toFixed(num < 1 ? 4 : 2);
}
