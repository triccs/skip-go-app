import { useQueryState } from "nuqs";
import { useMemo } from "react";

export interface RouteParams {
  srcChain: string | null;
  srcAsset: string | null;
  destChain: string | null;
  destAsset: string | null;
  amountIn: string | null;
}

/**
 * Parses URL query params for pre-filling the route form.
 * Used when launching from membrane-app liquidation page via iframe:
 *   /route?src_chain=osmosis-1&src_asset=uosmo&amount_in=1000000&dest_chain=cosmoshub-4&dest_asset=uatom
 */
export function useRouteParams() {
  const [srcChain, setSrcChain] = useQueryState("src_chain");
  const [srcAsset, setSrcAsset] = useQueryState("src_asset");
  const [destChain, setDestChain] = useQueryState("dest_chain");
  const [destAsset, setDestAsset] = useQueryState("dest_asset");
  const [amountIn, setAmountIn] = useQueryState("amount_in");

  const params = useMemo<RouteParams>(
    () => ({
      srcChain,
      srcAsset,
      destChain,
      destAsset,
      amountIn,
    }),
    [srcChain, srcAsset, destChain, destAsset, amountIn],
  );

  const hasParams = !!(srcChain && srcAsset && destChain && destAsset);

  return {
    params,
    hasParams,
    setSrcChain,
    setSrcAsset,
    setDestChain,
    setDestAsset,
    setAmountIn,
  };
}
