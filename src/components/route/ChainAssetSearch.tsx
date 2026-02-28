import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { getAssets, getChains } from "@/services/skipRoute";
import type { AssetInfo, ChainInfo } from "@/types/route";
import { cn } from "@/utils/ui";

interface ChainAssetSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (chainId: string, asset: AssetInfo) => void;
  title: string;
}

export function ChainAssetSearch({ isOpen, onClose, onSelect, title }: ChainAssetSearchProps) {
  const [search, setSearch] = useState("");
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: chains } = useQuery({
    queryKey: ["skip-chains"],
    queryFn: getChains,
    staleTime: 5 * 60_000,
  });

  const { data: assetsMap } = useQuery({
    queryKey: ["skip-assets", selectedChain],
    queryFn: () => getAssets(selectedChain ?? undefined),
    staleTime: 5 * 60_000,
    enabled: !!selectedChain,
  });

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedChain(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Filter chains by search
  const filteredChains = useMemo(() => {
    if (!chains) return [];
    const q = search.toLowerCase();
    if (!q) return chains.slice(0, 50);
    return chains
      .filter((c) => c.chain_name.toLowerCase().includes(q) || c.chain_id.toLowerCase().includes(q))
      .slice(0, 30);
  }, [chains, search]);

  // Filter assets by search
  const filteredAssets = useMemo(() => {
    if (!assetsMap || !selectedChain) return [];
    const assets = assetsMap[selectedChain] ?? [];
    const q = search.toLowerCase();
    if (!q) return assets.slice(0, 50);
    return assets
      .filter(
        (a) =>
          (a.symbol?.toLowerCase().includes(q) ?? false) ||
          (a.name?.toLowerCase().includes(q) ?? false) ||
          a.denom.toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [assetsMap, selectedChain, search]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#141414] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <div className="flex items-center gap-2">
            {selectedChain && (
              <button
                onClick={() => {
                  setSelectedChain(null);
                  setSearch("");
                }}
                className="rounded-lg p-1 text-white/60 transition-colors hover:bg-white/10"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M10 4L6 8L10 12" />
                </svg>
              </button>
            )}
            <h3 className="text-lg font-medium text-white">{selectedChain ? "Select Asset" : title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white/80"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6L14 14M14 6L6 14" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <input
            ref={inputRef}
            type="text"
            placeholder={selectedChain ? "Search tokens..." : "Search chains..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-all placeholder:text-white/30 focus:border-cyan-400/50 focus:outline-none focus:ring-1 focus:ring-cyan-400/30"
          />
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto px-2 pb-4 scrollbar-hide">
          {!selectedChain ? (
            // Chain list
            filteredChains.length > 0 ? (
              filteredChains.map((chain) => (
                <ChainRow
                  key={chain.chain_id}
                  chain={chain}
                  onClick={() => {
                    setSelectedChain(chain.chain_id);
                    setSearch("");
                  }}
                />
              ))
            ) : (
              <p className="py-8 text-center text-sm text-white/40">No chains found</p>
            )
          ) : // Asset list
          filteredAssets.length > 0 ? (
            filteredAssets.map((asset) => (
              <AssetRow
                key={asset.denom}
                asset={asset}
                onClick={() => {
                  onSelect(selectedChain, asset);
                  onClose();
                }}
              />
            ))
          ) : (
            <p className="py-8 text-center text-sm text-white/40">
              {assetsMap ? "No assets found" : "Loading assets..."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function ChainRow({ chain, onClick }: { chain: ChainInfo; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5",
        "text-left transition-colors hover:bg-white/5",
      )}
    >
      {chain.logo_uri ? (
        <img
          src={chain.logo_uri}
          alt={chain.chain_name}
          className="h-8 w-8 rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white/50">
          {chain.chain_name.slice(0, 2).toUpperCase()}
        </div>
      )}
      <div>
        <p className="text-sm font-medium capitalize text-white">{chain.chain_name}</p>
        <p className="text-xs text-white/40">{chain.chain_id}</p>
      </div>
      <div className="ml-auto">
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
            chain.chain_type === "cosmos" && "bg-purple-500/20 text-purple-300",
            chain.chain_type === "evm" && "bg-blue-500/20 text-blue-300",
            chain.chain_type === "svm" && "bg-green-500/20 text-green-300",
          )}
        >
          {chain.chain_type}
        </span>
      </div>
    </button>
  );
}

function AssetRow({ asset, onClick }: { asset: AssetInfo; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5",
        "text-left transition-colors hover:bg-white/5",
      )}
    >
      {asset.logo_uri ? (
        <img
          src={asset.logo_uri}
          alt={asset.symbol ?? asset.denom}
          className="h-8 w-8 rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white/50">
          {(asset.symbol ?? asset.denom).slice(0, 2).toUpperCase()}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{asset.recommended_symbol ?? asset.symbol ?? asset.denom}</p>
        <p className="truncate text-xs text-white/40">{asset.name ?? asset.denom}</p>
      </div>
    </button>
  );
}
