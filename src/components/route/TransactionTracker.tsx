import type { ExecutionState } from "@/hooks/useSkipExecution";
import { cn } from "@/utils/ui";

interface TransactionTrackerProps {
  state: ExecutionState;
  onReset: () => void;
  onAbort?: () => void;
}

/**
 * Live progress tracker shown during route execution.
 * Shows step-by-step status for each transaction and transfer hop.
 */
export function TransactionTracker({ state, onReset, onAbort }: TransactionTrackerProps) {
  if (state.step === "idle") return null;

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/70">{getStepTitle(state)}</h3>
        {state.step !== "completed" && state.step !== "error" && onAbort && (
          <button
            onClick={onAbort}
            className="text-[11px] text-white/30 transition-colors hover:text-white/60"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Transaction progress bar */}
      {state.totalTxs > 1 && (
        <div className="flex items-center gap-1">
          {Array.from({ length: state.totalTxs }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all",
                i < state.currentTxIndex
                  ? "bg-emerald-400"
                  : i === state.currentTxIndex && state.step !== "error"
                    ? "animate-pulse bg-cyan-400"
                    : i === state.currentTxIndex && state.step === "error"
                      ? "bg-red-400"
                      : "bg-white/10",
              )}
            />
          ))}
        </div>
      )}

      {/* Step status */}
      <div className="space-y-2">
        <StepRow
          label="Sign Transaction"
          status={state.step === "signing" ? "active" : "done"}
          detail={state.totalTxs > 1 ? `Transaction ${state.currentTxIndex + 1} of ${state.totalTxs}` : undefined}
        />
        <StepRow
          label="Broadcast"
          status={
            state.step === "broadcasting" ? "active" : ["signing", "idle"].includes(state.step) ? "pending" : "done"
          }
        />
        <StepRow
          label="Confirm & Track"
          status={
            state.step === "tracking"
              ? "active"
              : ["signing", "broadcasting", "idle"].includes(state.step)
                ? "pending"
                : state.step === "completed"
                  ? "done"
                  : "error"
          }
        />
      </div>

      {/* Transfer events */}
      {state.transfers.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] uppercase tracking-wider text-white/30">Transfer Hops</span>
          {state.transfers.map((transfer, i) => {
            const srcName = transfer.src_chain_id.replace(/-\d+$/, "");
            const dstName = transfer.dst_chain_id.replace(/-\d+$/, "");

            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-[11px]",
                  transfer.state === "TRANSFER_SUCCESS"
                    ? "border border-emerald-400/10 bg-emerald-400/5"
                    : transfer.state === "TRANSFER_FAILURE"
                      ? "border border-red-400/10 bg-red-400/5"
                      : transfer.state === "TRANSFER_PENDING"
                        ? "border border-yellow-400/10 bg-yellow-400/5"
                        : "border border-white/5 bg-white/[0.02]",
                )}
              >
                <span className="capitalize text-white/60">{srcName}</span>
                <svg
                  width="12"
                  height="8"
                  viewBox="0 0 12 8"
                  fill="none"
                  className="flex-shrink-0 text-white/20"
                >
                  <path
                    d="M1 4H10M10 4L7 1M10 4L7 7"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="capitalize text-white/60">{dstName}</span>
                <span className="ml-auto text-white/30">{getTransferStateLabel(transfer.state)}</span>

                {/* Explorer links */}
                {transfer.packet_txs.send_tx?.explorer_link && (
                  <a
                    href={transfer.packet_txs.send_tx.explorer_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400/60 transition-colors hover:text-cyan-400"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M4 1H2C1.45 1 1 1.45 1 2V10C1 10.55 1.45 11 2 11H10C10.55 11 11 10.55 11 10V8M7 1H11V5M11 1L5 7"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tx hash */}
      {state.txHash && <div className="truncate font-mono text-[10px] text-white/20">tx: {state.txHash}</div>}

      {/* Error state */}
      {state.step === "error" && (
        <div className="space-y-2">
          <div className="rounded-lg border border-red-400/10 bg-red-400/5 px-3 py-2.5 text-xs text-red-300/80">
            {state.error ?? "Transaction failed"}
          </div>

          {/* Asset release info */}
          {state.txStatus?.transfer_asset_release && (
            <div className="rounded-lg border border-yellow-400/10 bg-yellow-400/5 px-3 py-2 text-[11px] text-yellow-300/70">
              <p className="mb-1 font-medium">Funds location:</p>
              <p className="font-mono text-[10px]">
                Chain: {state.txStatus.transfer_asset_release.chain_id}
                <br />
                Amount: {state.txStatus.transfer_asset_release.amount}
                <br />
                Released: {state.txStatus.transfer_asset_release.released ? "Yes" : "Pending"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Success state */}
      {state.step === "completed" && (
        <div className="rounded-lg border border-emerald-400/10 bg-emerald-400/5 px-3 py-3 text-center text-sm text-emerald-300">
          Route completed successfully
        </div>
      )}

      {/* Reset button */}
      {(state.step === "completed" || state.step === "error") && (
        <button
          onClick={onReset}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm text-white/60 transition-all hover:bg-white/10 hover:text-white/80"
        >
          {state.step === "completed" ? "New Route" : "Try Again"}
        </button>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────

function StepRow({
  label,
  status,
  detail,
}: {
  label: string;
  status: "pending" | "active" | "done" | "error";
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {/* Status icon */}
      {status === "done" && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="flex-shrink-0 text-emerald-400"
        >
          <circle
            cx="8"
            cy="8"
            r="7"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M5 8L7 10L11 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {status === "active" && (
        <div className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      )}
      {status === "pending" && <div className="h-4 w-4 flex-shrink-0 rounded-full border border-white/10" />}
      {status === "error" && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="flex-shrink-0 text-red-400"
        >
          <circle
            cx="8"
            cy="8"
            r="7"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M6 6L10 10M10 6L6 10"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )}

      <span
        className={cn(
          "text-xs",
          status === "active"
            ? "text-cyan-300"
            : status === "done"
              ? "text-white/50"
              : status === "error"
                ? "text-red-300"
                : "text-white/20",
        )}
      >
        {label}
      </span>
      {detail && <span className="ml-auto text-[10px] text-white/20">{detail}</span>}
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────

function getStepTitle(state: ExecutionState): string {
  switch (state.step) {
    case "signing":
      return "Waiting for Signature...";
    case "broadcasting":
      return "Broadcasting Transaction...";
    case "tracking":
      return "Tracking Route Progress...";
    case "completed":
      return "Route Complete";
    case "error":
      return "Route Failed";
    default:
      return "Executing Route";
  }
}

function getTransferStateLabel(state: string): string {
  switch (state) {
    case "TRANSFER_PENDING":
      return "pending";
    case "TRANSFER_RECEIVED":
      return "received";
    case "TRANSFER_SUCCESS":
      return "complete";
    case "TRANSFER_FAILURE":
      return "failed";
    default:
      return "waiting";
  }
}
