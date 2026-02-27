import { useCallback, useRef, useState } from "react";

import { getTxStatus, trackTx } from "@/services/skipRoute";
import type { MessagesResponse, TransferEvent, TxState, TxStatusResponse } from "@/types/route";

export type ExecutionStep = "idle" | "signing" | "broadcasting" | "tracking" | "completed" | "error";

export interface ExecutionState {
  step: ExecutionStep;
  currentTxIndex: number;
  totalTxs: number;
  txHash: string | null;
  txChainId: string | null;
  txStatus: TxStatusResponse | null;
  transfers: TransferEvent[];
  error: string | null;
}

const INITIAL_STATE: ExecutionState = {
  step: "idle",
  currentTxIndex: 0,
  totalTxs: 0,
  txHash: null,
  txChainId: null,
  txStatus: null,
  transfers: [],
  error: null,
};

/**
 * Manages the full transaction execution lifecycle:
 * sign → broadcast → track → poll status until completion.
 *
 * The actual signing/broadcasting is delegated to a callback since
 * it depends on the wallet SDK being used (cosmos-kit, wagmi, etc).
 */
export function useSkipExecution() {
  const [state, setState] = useState<ExecutionState>(INITIAL_STATE);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    abortRef.current = false;
    setState(INITIAL_STATE);
  }, [stopPolling]);

  const abort = useCallback(() => {
    abortRef.current = true;
    stopPolling();
    setState((s) => ({ ...s, step: "idle" }));
  }, [stopPolling]);

  /**
   * Poll tx status until terminal state.
   * Returns the final status.
   */
  const pollStatus = useCallback(
    (txHash: string, chainId: string): Promise<TxStatusResponse> => {
      return new Promise((resolve, reject) => {
        const poll = async () => {
          if (abortRef.current) {
            stopPolling();
            reject(new Error("Aborted"));
            return;
          }

          try {
            const status = await getTxStatus(txHash, chainId);

            setState((s) => ({
              ...s,
              txStatus: status,
              transfers: status.transfer_sequence ?? [],
            }));

            const terminal: TxState[] = ["STATE_COMPLETED_SUCCESS", "STATE_COMPLETED_ERROR", "STATE_ABANDONED"];

            if (terminal.includes(status.status)) {
              stopPolling();
              resolve(status);
            }
          } catch (err) {
            // Non-fatal — keep polling on transient errors
            console.warn("Status poll error:", err);
          }
        };

        // Initial call + 3s interval
        poll();
        pollingRef.current = setInterval(poll, 3000);
      });
    },
    [stopPolling],
  );

  /**
   * Execute the route.
   *
   * @param messages - The built messages from useSkipMessages
   * @param signAndBroadcast - Wallet-specific callback that signs and broadcasts
   *   a transaction, returning { txHash, chainId }
   */
  const execute = useCallback(
    async (
      messages: MessagesResponse,
      signAndBroadcast: (tx: MessagesResponse["txs"][number]) => Promise<{
        txHash: string;
        chainId: string;
      }>,
    ) => {
      reset();

      const txs = messages.txs;
      setState((s) => ({ ...s, totalTxs: txs.length }));

      try {
        for (let i = 0; i < txs.length; i++) {
          if (abortRef.current) return;

          const tx = txs[i];

          // Sign
          setState((s) => ({
            ...s,
            step: "signing",
            currentTxIndex: i,
          }));

          // Broadcast
          setState((s) => ({ ...s, step: "broadcasting" }));
          const { txHash, chainId } = await signAndBroadcast(tx);

          setState((s) => ({
            ...s,
            step: "tracking",
            txHash,
            txChainId: chainId,
          }));

          // Register for tracking
          try {
            await trackTx({ tx_hash: txHash, chain_id: chainId });
          } catch {
            // Tracking registration is best-effort
          }

          // Poll until this tx completes
          const finalStatus = await pollStatus(txHash, chainId);

          if (finalStatus.status === "STATE_COMPLETED_ERROR") {
            setState((s) => ({
              ...s,
              step: "error",
              error: finalStatus.error?.message ?? "Transaction failed on chain",
            }));
            return;
          }

          if (finalStatus.status === "STATE_ABANDONED") {
            setState((s) => ({
              ...s,
              step: "error",
              error: "Transaction was abandoned (stalled for 10+ minutes)",
            }));
            return;
          }
        }

        // All txs completed successfully
        setState((s) => ({ ...s, step: "completed" }));
      } catch (err) {
        setState((s) => ({
          ...s,
          step: "error",
          error: err instanceof Error ? err.message : "Execution failed",
        }));
      }
    },
    [reset, pollStatus],
  );

  return {
    state,
    execute,
    reset,
    abort,
  };
}
