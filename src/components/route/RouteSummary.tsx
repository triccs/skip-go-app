import type { RouteResponse } from "@/types/route";
import { cn } from "@/utils/ui";

interface RouteSummaryProps {
  route: RouteResponse;
}

export function RouteSummary({ route }: RouteSummaryProps) {
  const totalFeeUsd = (route.estimated_fees ?? []).reduce((sum, fee) => sum + parseFloat(fee.usd_amount ?? "0"), 0);

  const durationSeconds = route.estimated_route_duration_seconds ?? 0;
  const priceImpact = parseFloat(route.swap_price_impact_percent ?? "0");

  return (
    <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      {/* Main output */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40">Estimated Output</span>
        <span className="text-sm font-medium text-white">{formatAmount(route.amount_out, route.dest_asset_denom)}</span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Fees */}
        <SummaryItem
          label="Estimated Fee"
          value={totalFeeUsd > 0 ? `~$${totalFeeUsd.toFixed(2)}` : "Free"}
          valueColor={totalFeeUsd > 5 ? "text-yellow-300" : "text-white/70"}
        />

        {/* Duration */}
        <SummaryItem
          label="Est. Time"
          value={formatDuration(durationSeconds)}
          valueColor="text-white/70"
        />

        {/* Price impact */}
        {priceImpact > 0 && (
          <SummaryItem
            label="Price Impact"
            value={`${priceImpact.toFixed(2)}%`}
            valueColor={priceImpact > 3 ? "text-red-300" : priceImpact > 1 ? "text-yellow-300" : "text-white/70"}
          />
        )}

        {/* Transactions required */}
        <SummaryItem
          label="Transactions"
          value={`${route.txs_required}`}
          valueColor="text-white/70"
        />
      </div>

      {/* USD values */}
      {route.usd_amount_in && route.usd_amount_out && (
        <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[11px]">
          <span className="text-white/30">${parseFloat(route.usd_amount_in).toFixed(2)} in</span>
          <svg
            width="12"
            height="8"
            viewBox="0 0 12 8"
            fill="none"
            className="text-white/20"
          >
            <path
              d="M1 4H10M10 4L7 1M10 4L7 7"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-white/30">${parseFloat(route.usd_amount_out).toFixed(2)} out</span>
        </div>
      )}

      {/* Fee breakdown */}
      {(route.estimated_fees ?? []).length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-[11px] text-white/30 transition-colors hover:text-white/50">
            Fee breakdown
          </summary>
          <div className="mt-2 space-y-1">
            {(route.estimated_fees ?? []).map((fee, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-[10px]"
              >
                <span className="capitalize text-white/30">
                  {fee.fee_type.toLowerCase().replace(/_/g, " ")}
                  {fee.bridge_id && ` (${fee.bridge_id})`}
                </span>
                <span className="text-white/40">
                  {fee.usd_amount ? `$${parseFloat(fee.usd_amount).toFixed(2)}` : fee.amount}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function SummaryItem({ label, value, valueColor }: { label: string; value: string; valueColor: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-white/30">{label}</span>
      <span className={cn("text-sm font-medium", valueColor)}>{value}</span>
    </div>
  );
}

// ─── Formatting ────────────────────────────────────────────────────

function formatAmount(amount: string, denom: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return "0";

  let formatted: string;
  if (num >= 1_000_000) formatted = (num / 1_000_000).toFixed(2) + "M";
  else if (num >= 1_000) formatted = (num / 1_000).toFixed(2) + "K";
  else formatted = num.toFixed(num < 1 ? 6 : 4);

  const symbol = formatDenom(denom);
  return `${formatted} ${symbol}`;
}

function formatDenom(denom: string): string {
  if (denom.startsWith("ibc/")) return "IBC";
  if (denom.startsWith("u") && denom.length > 1) return denom.slice(1).toUpperCase();
  return denom.toUpperCase();
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return "Instant";
  if (seconds < 60) return `~${seconds}s`;
  if (seconds < 3600) return `~${Math.ceil(seconds / 60)}m`;
  return `~${(seconds / 3600).toFixed(1)}h`;
}
