import type {
  AssetInfo,
  ChainInfo,
  MessagesRequest,
  MessagesResponse,
  RouteRequest,
  RouteResponse,
  TxStatusResponse,
} from "@/types/route";

const API_BASE = "https://api.skip.build";

async function skipFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Skip API error ${res.status}: ${body}`);
  }

  return res.json();
}

// ─── Chain & Asset Discovery ───────────────────────────────────────

export async function getChains(): Promise<ChainInfo[]> {
  const data = await skipFetch<{ chains: ChainInfo[] }>("/v2/info/chains");
  return data.chains;
}

export async function getAssets(chainId?: string): Promise<Record<string, AssetInfo[]>> {
  const body: Record<string, unknown> = {
    include_no_metadata_assets: false,
    include_cw20_assets: true,
    include_evm_assets: true,
    include_svm_assets: true,
  };
  if (chainId) {
    body.chain_id = chainId;
  }

  const data = await skipFetch<{
    chain_to_assets_map: Record<string, { assets: AssetInfo[] }>;
  }>("/v2/fungible/assets", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const result: Record<string, AssetInfo[]> = {};
  for (const [chain, val] of Object.entries(data.chain_to_assets_map)) {
    result[chain] = val.assets;
  }
  return result;
}

// ─── Route ─────────────────────────────────────────────────────────

export async function getRoute(params: RouteRequest): Promise<RouteResponse> {
  return skipFetch<RouteResponse>("/v2/fungible/route", {
    method: "POST",
    body: JSON.stringify({
      smart_relay: true,
      smart_swap_options: { split_routes: true },
      allow_multi_tx: true,
      allow_unsafe: false,
      experimental_features: ["hyperlane", "stargate", "eureka", "layer_zero"],
      ...params,
    }),
  });
}

// ─── Messages ──────────────────────────────────────────────────────

export async function getMessages(params: MessagesRequest): Promise<MessagesResponse> {
  return skipFetch<MessagesResponse>("/v2/fungible/msgs", {
    method: "POST",
    body: JSON.stringify({
      enable_gas_warnings: true,
      smart_relay: true,
      ...params,
    }),
  });
}

// ─── Transaction Tracking ──────────────────────────────────────────

export async function submitTx(params: { tx: string; chain_id: string }): Promise<{ tx_hash: string }> {
  return skipFetch("/v2/tx/submit", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function trackTx(params: { tx_hash: string; chain_id: string }): Promise<{ tx_hash: string }> {
  return skipFetch("/v2/tx/track", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export async function getTxStatus(txHash: string, chainId: string): Promise<TxStatusResponse> {
  const qs = new URLSearchParams({ tx_hash: txHash, chain_id: chainId });
  return skipFetch<TxStatusResponse>(`/v2/tx/status?${qs}`);
}
