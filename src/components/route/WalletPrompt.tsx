import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import type { ChainAddress } from "@/hooks/useChainWallets";
import { isValidAddress } from "@/hooks/useChainWallets";
import { getChains } from "@/services/skipRoute";
import type { ChainInfo } from "@/types/route";
import { cn } from "@/utils/ui";

interface WalletPromptProps {
  requiredChainIds: string[];
  addresses: Map<string, ChainAddress>;
  onSetAddress: (chainId: string, address: string, source: ChainAddress["source"]) => void;
}

/**
 * Prompts the user for wallet connections or recovery addresses
 * for each chain in the route's required_chain_addresses.
 */
export function WalletPrompt({ requiredChainIds, addresses, onSetAddress }: WalletPromptProps) {
  const { data: chains } = useQuery({
    queryKey: ["skip-chains"],
    queryFn: getChains,
    staleTime: 5 * 60_000,
  });

  const chainMap = useMemo(() => {
    if (!chains) return new Map<string, ChainInfo>();
    return new Map(chains.map((c) => [c.chain_id, c]));
  }, [chains]);

  if (requiredChainIds.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-white/60">Wallet / Recovery Addresses</h3>
      <p className="text-[11px] text-white/30">
        Provide an address for each chain in the route. Connected wallets auto-fill. For chains without a wallet, enter
        a recovery address.
      </p>

      <div className="space-y-2">
        {requiredChainIds.map((chainId) => {
          const chain = chainMap.get(chainId);
          const existing = addresses.get(chainId);

          return (
            <ChainAddressRow
              key={chainId}
              chainId={chainId}
              chain={chain}
              existing={existing}
              onSetAddress={onSetAddress}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Per-Chain Row ─────────────────────────────────────────────────

function ChainAddressRow({
  chainId,
  chain,
  existing,
  onSetAddress,
}: {
  chainId: string;
  chain: ChainInfo | undefined;
  existing: ChainAddress | undefined;
  onSetAddress: WalletPromptProps["onSetAddress"];
}) {
  const [input, setInput] = useState(existing?.address ?? "");
  const [mode, setMode] = useState<"idle" | "recovery">(existing?.source === "recovery" ? "recovery" : "idle");

  const chainName = chain?.chain_name ?? chainId.replace(/-\d+$/, "");
  const chainType = chain?.chain_type ?? "cosmos";
  const bech32Prefix = chain?.bech32_prefix;

  const isValid = input ? isValidAddress(input, chainType, bech32Prefix) : false;

  const handleSubmitRecovery = () => {
    if (isValid) {
      onSetAddress(chainId, input, "recovery");
    }
  };

  // Already has an address
  if (existing) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
        {/* Chain icon */}
        <ChainIcon
          chain={chain}
          chainName={chainName}
        />

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium capitalize text-white/70">{chainName}</p>
          <p className="truncate font-mono text-[10px] text-white/30">{existing.address}</p>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider",
              existing.source === "wallet"
                ? "bg-emerald-400/10 text-emerald-300"
                : existing.source === "derived"
                  ? "bg-cyan-400/10 text-cyan-300"
                  : "bg-yellow-400/10 text-yellow-300",
            )}
          >
            {existing.source}
          </span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="text-emerald-400"
          >
            <path
              d="M3 7L6 10L11 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    );
  }

  // Needs address
  return (
    <div className="space-y-2.5 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3">
      <div className="flex items-center gap-3">
        <ChainIcon
          chain={chain}
          chainName={chainName}
        />
        <div className="flex-1">
          <p className="text-xs font-medium capitalize text-white/70">{chainName}</p>
          <p className="text-[10px] text-white/30">Recovery address needed — used if route fails mid-way</p>
        </div>
      </div>

      {mode === "idle" ? (
        <div className="flex gap-2">
          <button
            onClick={() => setMode("recovery")}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 transition-all hover:bg-white/10 hover:text-white/80"
          >
            Enter Recovery Address
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={getPlaceholder(chainType, bech32Prefix)}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className={cn(
                "flex-1 rounded-lg border bg-white/5 px-3 py-2 font-mono text-xs text-white transition-all placeholder:text-white/20 focus:outline-none",
                input && !isValid
                  ? "border-red-400/40 focus:border-red-400/60"
                  : "border-white/10 focus:border-cyan-400/40",
              )}
            />
            <button
              onClick={handleSubmitRecovery}
              disabled={!isValid}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-medium transition-all",
                isValid
                  ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20"
                  : "cursor-not-allowed border border-white/5 bg-white/5 text-white/20",
              )}
            >
              Set
            </button>
          </div>
          {input && !isValid && (
            <p className="text-[10px] text-red-300/70">
              Invalid {chainType} address
              {bech32Prefix ? ` (expected ${bech32Prefix}... prefix)` : ""}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────

function ChainIcon({ chain, chainName }: { chain: ChainInfo | undefined; chainName: string }) {
  if (chain?.logo_uri) {
    return (
      <img
        src={chain.logo_uri}
        alt={chainName}
        className="h-7 w-7 flex-shrink-0 rounded-full"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  return (
    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-white/50">
      {chainName.slice(0, 2).toUpperCase()}
    </div>
  );
}

function getPlaceholder(chainType: string, bech32Prefix?: string): string {
  switch (chainType) {
    case "cosmos":
      return bech32Prefix ? `${bech32Prefix}1...` : "cosmos1...";
    case "evm":
      return "0x...";
    case "svm":
      return "Solana address...";
    default:
      return "Enter address...";
  }
}
