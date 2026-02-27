import { useCallback, useMemo, useState } from "react";

export interface ChainAddress {
  chainId: string;
  address: string;
  source: "wallet" | "recovery" | "derived";
}

/**
 * Manages per-chain address state for route execution.
 * Tracks which chains from `required_chain_addresses` have addresses,
 * whether from connected wallets or manually-entered recovery addresses.
 */
export function useChainWallets(requiredChainIds: string[]) {
  const [addresses, setAddresses] = useState<Map<string, ChainAddress>>(new Map());

  const setAddress = useCallback((chainId: string, address: string, source: ChainAddress["source"]) => {
    setAddresses((prev) => {
      const next = new Map(prev);
      next.set(chainId, { chainId, address, source });
      return next;
    });
  }, []);

  const removeAddress = useCallback((chainId: string) => {
    setAddresses((prev) => {
      const next = new Map(prev);
      next.delete(chainId);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setAddresses(new Map());
  }, []);

  // Check which chains still need addresses
  const missingChains = useMemo(
    () => requiredChainIds.filter((id) => !addresses.has(id)),
    [requiredChainIds, addresses],
  );

  // Whether all required chains have addresses
  const isComplete = missingChains.length === 0 && requiredChainIds.length > 0;

  // Build the ordered address list matching required_chain_addresses order
  const orderedAddressList = useMemo(
    () => requiredChainIds.map((id) => addresses.get(id)?.address ?? ""),
    [requiredChainIds, addresses],
  );

  return {
    addresses,
    setAddress,
    removeAddress,
    clearAll,
    missingChains,
    isComplete,
    orderedAddressList,
  };
}

// ─── Address Validation ────────────────────────────────────────────

/** Validate a bech32 cosmos address (basic check) */
export function isValidCosmosAddress(address: string, expectedPrefix?: string): boolean {
  if (!address || address.length < 20) return false;
  if (expectedPrefix && !address.startsWith(expectedPrefix)) return false;
  // Basic bech32 character check
  return /^[a-z]+1[a-z0-9]{38,}$/i.test(address);
}

/** Validate an EVM address */
export function isValidEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/** Validate an address for a given chain type */
export function isValidAddress(address: string, chainType: "cosmos" | "evm" | "svm", bech32Prefix?: string): boolean {
  switch (chainType) {
    case "cosmos":
      return isValidCosmosAddress(address, bech32Prefix);
    case "evm":
      return isValidEvmAddress(address);
    case "svm":
      // Solana addresses are base58, 32-44 chars
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    default:
      return false;
  }
}
