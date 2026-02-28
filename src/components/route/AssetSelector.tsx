import { useState } from "react";

import type { AssetInfo } from "@/types/route";

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

/**
 * AssetSelector — mirrors the @skip-go/widget fund component styling.
 *
 * Uses the same dark card backgrounds, chevron button SVGs, and
 * ticket-shaped swap divider from the main fund widget.
 */
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
    <div className="flex flex-col items-center">
      {/* ── Source card ────────────────────────────────────────── */}
      <div className="w-full rounded-2xl bg-black/80 px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-2">
          <input
            type="text"
            lang="en-US"
            inputMode="decimal"
            placeholder="0"
            value={amountIn}
            onChange={(e) => {
              const val = e.target.value;
              if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                onAmountChange(val);
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-[28px] font-medium leading-tight text-white placeholder:text-white/25 focus:outline-none"
          />
          <button
            onClick={() => setSearchOpen("source")}
            className="flex shrink-0 items-center gap-2 rounded-lg transition-opacity hover:opacity-80"
          >
            {source ? (
              <div className="flex items-center gap-2">
                {source.asset.logo_uri && (
                  <img
                    src={source.asset.logo_uri}
                    alt=""
                    className="h-[23px] w-[23px] rounded-full"
                  />
                )}
                <span className="text-[15px] font-medium text-white">
                  {source.asset.recommended_symbol ?? source.asset.symbol ?? source.asset.denom}
                </span>
              </div>
            ) : (
              <span className="text-[15px] font-medium text-white/60">Select asset</span>
            )}
            <WidgetChevron />
          </button>
        </div>
        {/* Balance / chain row */}
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[13px] text-white/30">{/* USD value placeholder */}</span>
          {source && (
            <span className="text-[13px] capitalize text-white/30">on {source.chainId.replace(/-\d+$/, "")}</span>
          )}
        </div>
      </div>

      {/* ── Swap divider (ticket shape) ──────────────────────── */}
      <div className="relative z-10 -my-[2px] flex items-center justify-center">
        <button
          onClick={onSwap}
          className="group relative flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
          aria-label="Swap source and destination"
        >
          <svg
            width="47"
            height="7"
            viewBox="0 0 47 7"
            fill="none"
            className="block"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M0.477783 0.000183105H46.4778V1.00416C45.1089 1.01674 44.0032 2.13029 44.0032 3.5021C44.0032 4.87391 45.1089 5.98746 46.4778 6.00004V7.00018H0.477783V5.99322C1.76984 5.89734 2.78833 4.81866 2.78833 3.5021C2.78833 2.18554 1.76984 1.10686 0.477783 1.01098V0.000183105Z"
              fill="#000000"
            />
          </svg>
          <svg
            width="13"
            height="13"
            viewBox="0 0 13 13"
            fill="none"
            className="absolute text-white transition-transform group-hover:translate-y-[1px]"
          >
            <path
              d="M7.48395 6.5705L7.48395 0.568512H5.46938L5.46938 6.5705C5.46938 7.30917 4.57625 7.67985 4.05381 7.15741L1.76526 4.86889L0.34029 6.29384L6.478 12.4315L12.613 6.29653L11.1881 4.87157L8.9022 7.15875C8.37976 7.68119 7.48528 7.31186 7.48528 6.57185"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>

      {/* ── Destination card ──────────────────────────────────── */}
      <div className="w-full rounded-2xl bg-black/80 px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 text-[28px] font-medium leading-tight">
            {isLoadingRoute ? (
              <span className="inline-block h-8 w-24 animate-pulse rounded-lg bg-white/5" />
            ) : estimatedOut ? (
              <span className="text-white/70">{formatDisplayAmount(estimatedOut)}</span>
            ) : (
              <span className="text-white/25">0</span>
            )}
          </div>
          <button
            onClick={() => setSearchOpen("dest")}
            className="flex shrink-0 items-center gap-2 rounded-lg transition-opacity hover:opacity-80"
          >
            {dest ? (
              <div className="flex items-center gap-2">
                {dest.asset.logo_uri && (
                  <img
                    src={dest.asset.logo_uri}
                    alt=""
                    className="h-[23px] w-[23px] rounded-full"
                  />
                )}
                <span className="text-[15px] font-medium text-white">
                  {dest.asset.recommended_symbol ?? dest.asset.symbol ?? dest.asset.denom}
                </span>
              </div>
            ) : (
              <span className="text-[15px] font-medium text-white/60">Select asset</span>
            )}
            <WidgetChevron />
          </button>
        </div>
        {/* Balance / chain row */}
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[13px] text-white/30">{/* USD value placeholder */}</span>
          {dest && (
            <button className="text-[13px] capitalize text-white/30 transition-colors hover:text-white/50">
              on {dest.chainId.replace(/-\d+$/, "")}
            </button>
          )}
        </div>
      </div>

      {/* ── Search modals ─────────────────────────────────────── */}
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

// ─── Widget Chevron SVG (exact match) ──────────────────────────────

function WidgetChevron() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      className="shrink-0"
    >
      <rect
        width="40"
        height="40"
        rx="10"
        fill="#141414"
      />
      <path
        d="M11.9383 15.031L9.5 17.4693L17.0773 25.0449C17.0785 25.0461 17.0798 25.0474 17.081 25.0486L20.0023 27.9692L29.281 18.6907C29.2832 18.6884 29.2855 18.6861 29.2878 18.6838L30.5 17.4716L28.0617 15.0333L22.9273 20.1692C22.9246 20.1719 22.922 20.1745 22.9193 20.1771C21.3072 21.7811 18.7025 21.7826 17.0887 20.1813C17.0847 20.1774 17.0808 20.1736 17.0769 20.1696L11.9383 15.031Z"
        fill="#ffffff"
      />
    </svg>
  );
}

// ─── Display amount formatter ──────────────────────────────────────

function formatDisplayAmount(amount: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return "0";
  if (num < 0.01) return "<0.01";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(2) + "K";
  return num.toFixed(num < 1 ? 4 : 2);
}
