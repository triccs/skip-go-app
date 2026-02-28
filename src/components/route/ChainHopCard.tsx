import type { ChainInfo, Operation } from "@/types/route";
import { getOperationChains, getOperationType } from "@/types/route";
import { cn } from "@/utils/ui";

interface ChainHopCardProps {
  operation: Operation;
  chainInfo?: ChainInfo;
  isFirst?: boolean;
  isLast?: boolean;
  isDisabled?: boolean;
  onToggleDisable?: (chainId: string) => void;
  /** Current transfer status for this hop during execution */
  transferStatus?: "pending" | "received" | "success" | "failure";
}

export function ChainHopCard({
  operation,
  chainInfo,
  isFirst,
  isLast,
  isDisabled,
  onToggleDisable,
  transferStatus,
}: ChainHopCardProps) {
  const opType = getOperationType(operation);
  const { from, to } = getOperationChains(operation);
  const displayChain = isFirst ? from : to;
  const chainName = chainInfo?.chain_name ?? displayChain.replace(/-\d+$/, "");

  return (
    <div className="flex items-center gap-0">
      {/* Connecting arrow (not on first) */}
      {!isFirst && (
        <div className="-mx-1 flex items-center">
          <div className={cn("h-px w-6", isDisabled ? "bg-white/10" : "bg-cyan-400/40")} />
          <svg
            width="8"
            height="12"
            viewBox="0 0 8 12"
            fill="none"
            className={cn("-ml-1", isDisabled ? "text-white/10" : "text-cyan-400/40")}
          >
            <path
              d="M1 1L6 6L1 11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Hop card */}
      <button
        onClick={() => {
          if (onToggleDisable && !isFirst && !isLast) {
            onToggleDisable(displayChain);
          }
        }}
        disabled={isFirst || isLast}
        className={cn(
          "relative flex min-w-[90px] flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 transition-all",
          isDisabled ? "border-white/5 bg-black/60 opacity-40" : "border-white/10 bg-black/80",
          !isFirst && !isLast && !isDisabled && "cursor-pointer hover:border-cyan-400/30",
          !isFirst && !isLast && isDisabled && "cursor-pointer hover:border-white/20",
          (isFirst || isLast) && "cursor-default",
          transferStatus === "success" && "border-emerald-400/30 bg-emerald-400/5",
          transferStatus === "failure" && "border-red-400/30 bg-red-400/5",
          transferStatus === "pending" && "animate-pulse border-yellow-400/20",
        )}
      >
        {/* Chain icon */}
        {chainInfo?.logo_uri ? (
          <img
            src={chainInfo.logo_uri}
            alt={chainName}
            className="h-7 w-7 rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-white/50">
            {chainName.slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Chain name */}
        <span className="max-w-[80px] truncate text-[11px] font-medium capitalize text-white/70">{chainName}</span>

        {/* Operation type badge */}
        <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wider", getBadgeColor(opType))}>
          {opType}
        </span>

        {/* Transfer status indicator */}
        {transferStatus && (
          <div className="absolute -right-1 -top-1">
            <StatusDot status={transferStatus} />
          </div>
        )}

        {/* Disable indicator for intermediate chains */}
        {!isFirst && !isLast && (
          <div
            className={cn(
              "absolute -bottom-1 left-1/2 -translate-x-1/2",
              "rounded px-1 text-[8px]",
              isDisabled ? "bg-red-400/10 text-red-300/60" : "text-white/0 group-hover:text-white/30",
            )}
          >
            {isDisabled ? "disabled" : ""}
          </div>
        )}
      </button>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────

function getBadgeColor(opType: string): string {
  switch (opType) {
    case "IBC Transfer":
      return "bg-purple-500/20 text-purple-300";
    case "Swap":
    case "EVM Swap":
      return "bg-cyan-500/20 text-cyan-300";
    case "CCTP":
      return "bg-blue-500/20 text-blue-300";
    case "Axelar":
      return "bg-indigo-500/20 text-indigo-300";
    case "Hyperlane":
      return "bg-emerald-500/20 text-emerald-300";
    case "GoFast":
      return "bg-yellow-500/20 text-yellow-300";
    case "Stargate":
      return "bg-pink-500/20 text-pink-300";
    case "LayerZero":
      return "bg-teal-500/20 text-teal-300";
    case "Eureka":
      return "bg-orange-500/20 text-orange-300";
    default:
      return "bg-white/10 text-white/50";
  }
}

function StatusDot({ status }: { status: "pending" | "received" | "success" | "failure" }) {
  const colors = {
    pending: "bg-yellow-400",
    received: "bg-cyan-400",
    success: "bg-emerald-400",
    failure: "bg-red-400",
  };

  return (
    <span className="relative flex h-3 w-3">
      {status === "pending" && (
        <span
          className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", colors[status])}
        />
      )}
      <span className={cn("relative inline-flex h-3 w-3 rounded-full", colors[status])} />
    </span>
  );
}
