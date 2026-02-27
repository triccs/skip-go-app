import type { Operation } from "@/types/route";
import { cn } from "@/utils/ui";

interface SplitRouteViewProps {
  operations: Operation[];
}

/**
 * Shows split/partial routes when a swap operation
 * contains multiple swap sub-operations for better price execution.
 */
export function SplitRouteView({ operations }: SplitRouteViewProps) {
  // Extract swap operations with multiple legs
  const swapOps = operations.filter((op) => "swap" in op && op.swap.swap_in.swap_operations.length > 1);

  if (swapOps.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-[11px] font-medium uppercase tracking-wider text-white/40">Split Route Detail</h4>

      {swapOps.map((op, idx) => {
        if (!("swap" in op)) return null;
        const { swap_in } = op.swap;

        return (
          <div
            key={idx}
            className="space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-3"
          >
            {/* Venue info */}
            <div className="flex items-center gap-2">
              {swap_in.swap_venue.logo_uri && (
                <img
                  src={swap_in.swap_venue.logo_uri}
                  alt={swap_in.swap_venue.name}
                  className="h-4 w-4 rounded-full"
                />
              )}
              <span className="text-xs font-medium text-white/60">via {swap_in.swap_venue.name}</span>
              {swap_in.price_impact_percent && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px]",
                    parseFloat(swap_in.price_impact_percent) > 1
                      ? "bg-red-400/10 text-red-300"
                      : "bg-white/5 text-white/40",
                  )}
                >
                  {parseFloat(swap_in.price_impact_percent).toFixed(2)}% impact
                </span>
              )}
            </div>

            {/* Swap legs */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {swap_in.swap_operations.map((leg, legIdx) => (
                <div
                  key={legIdx}
                  className="flex items-center gap-1"
                >
                  {legIdx > 0 && (
                    <svg
                      width="10"
                      height="8"
                      viewBox="0 0 10 8"
                      fill="none"
                      className="flex-shrink-0 text-white/20"
                    >
                      <path
                        d="M1 4H8M8 4L5 1M8 4L5 7"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <div className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[10px]">
                    <span className="max-w-[60px] truncate text-white/50">{formatDenom(leg.denom_in)}</span>
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      fill="none"
                      className="flex-shrink-0 text-cyan-400/50"
                    >
                      <path
                        d="M1 4H7M7 4L4 1.5M7 4L4 6.5"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="max-w-[60px] truncate text-white/50">{formatDenom(leg.denom_out)}</span>
                    <span className="text-[9px] text-white/20">pool:{leg.pool}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDenom(denom: string): string {
  // Strip IBC hash prefix for readability
  if (denom.startsWith("ibc/")) return "IBC..." + denom.slice(-6);
  if (denom.startsWith("factory/")) {
    const parts = denom.split("/");
    return parts[parts.length - 1] ?? denom;
  }
  // Strip 'u' prefix for micro-denominations
  if (denom.startsWith("u") && denom.length > 1) return denom.slice(1).toUpperCase();
  return denom;
}
