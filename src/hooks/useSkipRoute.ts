import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getRoute } from "@/services/skipRoute";
import type { RouteRequest, RouteResponse } from "@/types/route";

interface UseSkipRouteParams {
  sourceAssetDenom: string;
  sourceAssetChainId: string;
  destAssetDenom: string;
  destAssetChainId: string;
  amountIn: string;
  excludedBridges?: string[];
}

/**
 * Fetches an optimal cross-chain route from Skip Protocol.
 * Debounces amount changes by 500ms to avoid spamming the API.
 * Supports bridge exclusions for chain-disabling UX.
 */
export function useSkipRoute({
  sourceAssetDenom,
  sourceAssetChainId,
  destAssetDenom,
  destAssetChainId,
  amountIn,
  excludedBridges,
}: UseSkipRouteParams) {
  const [debouncedAmount, setDebouncedAmount] = useState(amountIn);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAmount(amountIn), 500);
    return () => clearTimeout(timer);
  }, [amountIn]);

  const enabled =
    !!sourceAssetDenom &&
    !!sourceAssetChainId &&
    !!destAssetDenom &&
    !!destAssetChainId &&
    !!debouncedAmount &&
    debouncedAmount !== "0";

  const excludedKey = excludedBridges?.sort().join(",") ?? "";

  const query = useQuery<RouteResponse, Error>({
    queryKey: [
      "skip-route",
      sourceAssetDenom,
      sourceAssetChainId,
      destAssetDenom,
      destAssetChainId,
      debouncedAmount,
      excludedKey,
    ],
    queryFn: async () => {
      const params: RouteRequest = {
        source_asset_denom: sourceAssetDenom,
        source_asset_chain_id: sourceAssetChainId,
        dest_asset_denom: destAssetDenom,
        dest_asset_chain_id: destAssetChainId,
        amount_in: debouncedAmount,
      };

      return getRoute(params);
    },
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    route: query.data,
    isLoading: query.isLoading || (enabled && debouncedAmount !== amountIn),
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
