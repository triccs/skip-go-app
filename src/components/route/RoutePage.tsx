import { useCallback, useEffect, useMemo, useState } from "react";

import { useChainWallets } from "@/hooks/useChainWallets";
import { useRouteParams } from "@/hooks/useRouteParams";
import { useSkipExecution } from "@/hooks/useSkipExecution";
import { useSkipMessages } from "@/hooks/useSkipMessages";
import { useSkipRoute } from "@/hooks/useSkipRoute";
import { useTheme } from "@/hooks/useTheme";
import type { AssetInfo } from "@/types/route";
import { cn } from "@/utils/ui";

import { AssetSelector, type SelectedAsset } from "./AssetSelector";
import { RouteExecutor } from "./RouteExecutor";
import { RouteSummary } from "./RouteSummary";
import { RouteVisualizer } from "./RouteVisualizer";
import { TransactionTracker } from "./TransactionTracker";
import { WalletPrompt } from "./WalletPrompt";

export function RoutePage() {
  const theme = useTheme();
  const { params, hasParams } = useRouteParams();

  // ─── Asset selection state ─────────────────────────────────────
  const [source, setSource] = useState<SelectedAsset | null>(null);
  const [dest, setDest] = useState<SelectedAsset | null>(null);
  const [amountIn, setAmountIn] = useState("");
  const [slippage, setSlippage] = useState("1");
  const [disabledChains, setDisabledChains] = useState<Set<string>>(new Set());

  // Pre-fill from URL params
  useEffect(() => {
    if (hasParams && params.amountIn) {
      setAmountIn(params.amountIn);
    }
    // Source/dest are pre-filled by denom, resolved after chain/asset data loads
    // For now, URL params set the raw denoms; ChainAssetSearch will resolve them
  }, [hasParams, params]);

  // ─── Route fetching ────────────────────────────────────────────
  const {
    route,
    isLoading: isRouteLoading,
    error: routeError,
  } = useSkipRoute({
    sourceAssetDenom: source?.asset.denom ?? params.srcAsset ?? "",
    sourceAssetChainId: source?.chainId ?? params.srcChain ?? "",
    destAssetDenom: dest?.asset.denom ?? params.destAsset ?? "",
    destAssetChainId: dest?.chainId ?? params.destChain ?? "",
    amountIn: amountIn || "0",
  });

  // ─── Chain wallets ─────────────────────────────────────────────
  const requiredChains = route?.required_chain_addresses ?? [];
  const { addresses, setAddress, isComplete, orderedAddressList } = useChainWallets(requiredChains);

  // ─── Message building ──────────────────────────────────────────
  const {
    buildMessages,
    messages,
    isBuilding,
    error: msgError,
  } = useSkipMessages({
    route,
    addressList: orderedAddressList,
    slippageTolerancePercent: slippage,
  });

  // ─── Execution ─────────────────────────────────────────────────
  const { state: execState, execute, reset: resetExec, abort: abortExec } = useSkipExecution();

  // ─── Handlers ──────────────────────────────────────────────────
  const handleSourceSelect = useCallback((chainId: string, asset: AssetInfo) => {
    setSource({ chainId, asset });
  }, []);

  const handleDestSelect = useCallback((chainId: string, asset: AssetInfo) => {
    setDest({ chainId, asset });
  }, []);

  const handleSwap = useCallback(() => {
    const prevSource = source;
    const prevDest = dest;
    setSource(prevDest);
    setDest(prevSource);
  }, [source, dest]);

  const handleToggleChain = useCallback((chainId: string) => {
    setDisabledChains((prev) => {
      const next = new Set(prev);
      if (next.has(chainId)) {
        next.delete(chainId);
      } else {
        next.add(chainId);
      }
      return next;
    });
  }, []);

  const handleExecute = useCallback(async () => {
    try {
      const msgs = await buildMessages();

      // The signAndBroadcast callback will be provided by the wallet integration.
      // For now, we expose a placeholder that the parent can override.
      await execute(msgs, async (tx) => {
        // In production, this delegates to cosmos-kit or wagmi signing
        // For the iframe integration, membrane-app will provide this via postMessage
        if (tx.cosmos_tx) {
          // Sign with Cosmos wallet
          // const signedTx = await sign(tx.cosmos_tx.msgs, fee)
          // const result = await broadcast(signedTx)
          // return { txHash: result.transactionHash, chainId: tx.cosmos_tx.chain_id }
          throw new Error("Wallet signing not yet connected. Connect via membrane-app iframe.");
        }
        if (tx.evm_tx) {
          throw new Error("EVM wallet signing not yet connected.");
        }
        throw new Error("Unsupported transaction type");
      });
    } catch (err) {
      console.error("Execution error:", err);
    }
  }, [buildMessages, execute]);

  // Compute estimated output for display (human-readable amount)
  const estimatedOut = useMemo(() => {
    if (!route?.amount_out) return undefined;
    const raw = route.amount_out;
    const decimals = dest?.asset.decimals ?? 6;
    const num = parseFloat(raw) / Math.pow(10, decimals);
    return num.toString();
  }, [route, dest]);

  // Gas warning from messages
  const gasWarning = messages?.warning?.message ?? msgError?.message ?? null;

  const isExecuting = execState.step !== "idle";

  return (
    <div
      className={cn(
        "bg-[#191919] font-sans subpixel-antialiased",
        "relative overflow-x-hidden overflow-y-hidden",
        "before:fixed before:inset-x-0 before:bottom-0 before:h-[100vh] before:content-['']",
        "before:bg-cover before:bg-[center_top] before:bg-no-repeat",
        theme === "dark" ? "before:bg-[url(/dark-bg.svg)]" : theme === "light" ? "before:bg-[url(/light-bg.svg)]" : "",
      )}
    >
      <main className="relative flex min-h-screen flex-col">
        <div className="flex flex-grow flex-col items-center justify-center">
          <div className="widget-container">
            <img
              src="/membrane-logo.svg"
              alt="Membrane"
              className="mx-auto mb-4 h-[36px]"
            />

            <div className="space-y-4">
              <AssetSelector
                source={source}
                dest={dest}
                amountIn={amountIn}
                onSourceSelect={handleSourceSelect}
                onDestSelect={handleDestSelect}
                onAmountChange={setAmountIn}
                onSwap={handleSwap}
                estimatedOut={estimatedOut}
                isLoadingRoute={isRouteLoading}
              />

              {routeError && (
                <div className="rounded-lg border border-red-400/10 bg-red-400/5 px-3 py-2 text-xs text-red-300/80">
                  {routeError.message}
                </div>
              )}

              {route && !isExecuting && (
                <>
                  <RouteVisualizer
                    route={route}
                    disabledChains={disabledChains}
                    onToggleChain={handleToggleChain}
                    transferEvents={execState.step === "tracking" ? execState.transfers : undefined}
                  />
                  <RouteSummary route={route} />
                </>
              )}

              {route && !isExecuting && requiredChains.length > 0 && (
                <WalletPrompt
                  requiredChainIds={requiredChains}
                  addresses={addresses}
                  onSetAddress={setAddress}
                />
              )}

              {!isExecuting && (
                <RouteExecutor
                  route={route}
                  isComplete={isComplete}
                  isBuilding={isBuilding}
                  isExecuting={false}
                  onExecute={handleExecute}
                  gasWarning={gasWarning}
                  slippage={slippage}
                  onSlippageChange={setSlippage}
                />
              )}

              {isExecuting && (
                <>
                  {route && (
                    <RouteVisualizer
                      route={route}
                      disabledChains={disabledChains}
                      onToggleChain={() => {}}
                      transferEvents={execState.transfers}
                    />
                  )}
                  <TransactionTracker
                    state={execState}
                    onReset={() => {
                      resetExec();
                    }}
                    onAbort={execState.step !== "completed" && execState.step !== "error" ? abortExec : undefined}
                  />
                </>
              )}

              {isRouteLoading && !route && (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-white/30">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-400/40 border-t-transparent" />
                  Finding best route...
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hidden w-full flex-row items-center justify-center px-8 py-6 md:flex">
          <p className={`text-center text-[13px] opacity-50 ${theme === "dark" ? "text-white" : "text-black"}`}>
            Powered by Skip:Go
          </p>
        </div>
      </main>
    </div>
  );
}
