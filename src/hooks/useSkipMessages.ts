import { useMutation } from "@tanstack/react-query";

import { getMessages } from "@/services/skipRoute";
import type { MessagesRequest, MessagesResponse, RouteResponse } from "@/types/route";

interface UseSkipMessagesParams {
  route: RouteResponse | undefined;
  addressList: string[];
  slippageTolerancePercent?: string;
}

/**
 * Builds signable transaction messages from a route + address list.
 * Called when user clicks "Execute Route" — not a query, a mutation.
 */
export function useSkipMessages({ route, addressList, slippageTolerancePercent = "1" }: UseSkipMessagesParams) {
  const mutation = useMutation<MessagesResponse, Error>({
    mutationFn: async () => {
      if (!route) throw new Error("No route available");

      if (addressList.length !== route.required_chain_addresses.length) {
        throw new Error(`Expected ${route.required_chain_addresses.length} addresses, got ${addressList.length}`);
      }

      const params: MessagesRequest = {
        source_asset_denom: route.source_asset_denom,
        source_asset_chain_id: route.source_asset_chain_id,
        dest_asset_denom: route.dest_asset_denom,
        dest_asset_chain_id: route.dest_asset_chain_id,
        amount_in: route.amount_in,
        amount_out: route.amount_out,
        operations: route.operations,
        address_list: addressList,
        slippage_tolerance_percent: slippageTolerancePercent,
      };

      return getMessages(params);
    },
  });

  return {
    buildMessages: mutation.mutateAsync,
    messages: mutation.data,
    isBuilding: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset,
  };
}
