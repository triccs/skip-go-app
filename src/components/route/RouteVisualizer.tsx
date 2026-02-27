import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { getChains } from "@/services/skipRoute";
import type { ChainInfo, RouteResponse, TransferEvent } from "@/types/route";
import { getOperationChains } from "@/types/route";
import { cn } from "@/utils/ui";

import { ChainHopCard } from "./ChainHopCard";
import { SplitRouteView } from "./SplitRouteView";

interface RouteVisualizerProps {
  route: RouteResponse;
  disabledChains: Set<string>;
  onToggleChain: (chainId: string) => void;
  /** Transfer events from execution tracking */
  transferEvents?: TransferEvent[];
}

export function RouteVisualizer({ route, disabledChains, onToggleChain, transferEvents }: RouteVisualizerProps) {
  const { data: chains } = useQuery({
    queryKey: ["skip-chains"],
    queryFn: getChains,
    staleTime: 5 * 60_000,
  });

  // Build a lookup map for chain info
  const chainMap = useMemo(() => {
    if (!chains) return new Map<string, ChainInfo>();
    return new Map(chains.map((c) => [c.chain_id, c]));
  }, [chains]);

  // Check if this route has split swap operations
  const hasSplitRoutes = route.operations.some(
    (op) => "swap" in op && op.swap.swap_in.swap_operations && op.swap.swap_in.swap_operations.length > 1,
  );

  // Map transfer events to operation indices for status display
  const transferStatusMap = useMemo(() => {
    if (!transferEvents) return new Map<number, TransferEvent["state"]>();
    const map = new Map<number, TransferEvent["state"]>();
    transferEvents.forEach((evt, i) => {
      map.set(i, evt.state);
    });
    return map;
  }, [transferEvents]);

  if (route.operations.length === 0) {
    return <div className="py-6 text-center text-sm text-white/40">No route operations found</div>;
  }

  return (
    <div className="space-y-4">
      {/* Route header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/60">Route</h3>
        <div className="flex items-center gap-2 text-[11px] text-white/30">
          <span>
            {route.operations.length} hop
            {route.operations.length !== 1 ? "s" : ""}
          </span>
          {route.txs_required > 1 && (
            <>
              <span className="text-white/10">|</span>
              <span>{route.txs_required} txs required</span>
            </>
          )}
        </div>
      </div>

      {/* Horizontal route visualization */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex min-w-min items-center py-2">
          {route.operations.map((op, i) => {
            const { from, to } = getOperationChains(op);
            const isFirst = i === 0;
            const isLast = i === route.operations.length - 1;
            const displayChain = isFirst ? from : to;
            const isDisabled = disabledChains.has(displayChain);

            // Map transfer state
            let transferStatus: "pending" | "received" | "success" | "failure" | undefined;
            const state = transferStatusMap.get(i);
            if (state === "TRANSFER_PENDING") transferStatus = "pending";
            else if (state === "TRANSFER_RECEIVED") transferStatus = "received";
            else if (state === "TRANSFER_SUCCESS") transferStatus = "success";
            else if (state === "TRANSFER_FAILURE") transferStatus = "failure";

            return (
              <ChainHopCard
                key={`${displayChain}-${i}`}
                operation={op}
                chainInfo={chainMap.get(displayChain)}
                isFirst={isFirst}
                isLast={isLast}
                isDisabled={isDisabled}
                onToggleDisable={onToggleChain}
                transferStatus={transferStatus}
              />
            );
          })}
        </div>
      </div>

      {/* Split route detail if applicable */}
      {hasSplitRoutes && <SplitRouteView operations={route.operations} />}

      {/* Disabled chains notice */}
      {disabledChains.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-400/10 bg-yellow-400/5 px-3 py-2 text-[11px] text-yellow-300/70">
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            className="flex-shrink-0"
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
          <span>
            {disabledChains.size} chain{disabledChains.size !== 1 ? "s" : ""} disabled — route will be recalculated.
            Click a chain to re-enable.
          </span>
        </div>
      )}

      {/* Route warning */}
      {route.warning && (
        <div
          className={cn(
            "rounded-lg border px-3 py-2 text-[11px]",
            route.warning.type === "BAD_PRICE_WARNING"
              ? "border-red-400/10 bg-red-400/5 text-red-300/70"
              : "border-yellow-400/10 bg-yellow-400/5 text-yellow-300/70",
          )}
        >
          {route.warning.message}
        </div>
      )}
    </div>
  );
}
