// Skip Protocol API types for cross-chain routing

// ─── Chain & Asset Info ────────────────────────────────────────────

export interface ChainInfo {
  chain_name: string;
  chain_id: string;
  pfm_enabled: boolean;
  cosmos_module_support: {
    authz: boolean;
    feegrant: boolean;
  };
  supports_memo: boolean;
  logo_uri?: string;
  bech32_prefix?: string;
  fee_assets?: FeeAsset[];
  chain_type: "cosmos" | "evm" | "svm";
  ibc_capabilities?: {
    cosmos_pfm: boolean;
    cosmos_ibc_hooks: boolean;
    cosmos_memo: boolean;
    cosmos_autopilot: boolean;
  };
}

export interface FeeAsset {
  denom: string;
  gas_price: {
    low: string;
    average: string;
    high: string;
  } | null;
}

export interface AssetInfo {
  denom: string;
  chain_id: string;
  origin_denom: string;
  origin_chain_id: string;
  trace: string;
  is_cw20: boolean;
  is_evm: boolean;
  is_svm: boolean;
  symbol?: string;
  name?: string;
  logo_uri?: string;
  decimals?: number;
  coingecko_id?: string;
  recommended_symbol?: string;
  token_contract?: string;
}

// ─── Route Request / Response ──────────────────────────────────────

export interface RouteRequest {
  source_asset_denom: string;
  source_asset_chain_id: string;
  dest_asset_denom: string;
  dest_asset_chain_id: string;
  amount_in?: string;
  amount_out?: string;
  cumulative_affiliate_fee_bps?: string;
  smart_relay?: boolean;
  smart_swap_options?: {
    split_routes?: boolean;
    evm_swaps?: boolean;
  };
  allow_multi_tx?: boolean;
  allow_unsafe?: boolean;
  bridges?: string[];
  allow_swaps?: boolean;
  experimental_features?: string[];
  go_fast?: boolean;
}

export interface RouteResponse {
  source_asset_denom: string;
  source_asset_chain_id: string;
  dest_asset_denom: string;
  dest_asset_chain_id: string;
  amount_in: string;
  amount_out: string;
  operations: Operation[];
  chain_ids: string[];
  required_chain_addresses: string[];
  does_swap: boolean;
  estimated_amount_out?: string;
  swap_venues?: SwapVenue[];
  txs_required: number;
  usd_amount_in?: string;
  usd_amount_out?: string;
  swap_price_impact_percent?: string;
  estimated_fees?: EstimatedFee[];
  estimated_route_duration_seconds?: number;
  warning?: RouteWarning;
}

export interface RouteWarning {
  type: string;
  message: string;
}

export interface EstimatedFee {
  fee_type: "SMART_RELAY" | "BRIDGE" | "SWAP" | string;
  bridge_id?: string;
  amount: string;
  usd_amount?: string;
  origin_asset: {
    denom: string;
    chain_id: string;
  };
}

export interface SwapVenue {
  name: string;
  chain_id: string;
  logo_uri?: string;
}

// ─── Operations ────────────────────────────────────────────────────

export type Operation =
  | TransferOperation
  | SwapOperation
  | EvmSwapOperation
  | AxelarTransferOperation
  | CCTPTransferOperation
  | HyperlaneTransferOperation
  | GoFastTransferOperation
  | StargateTransferOperation
  | LayerZeroTransferOperation
  | EurekaTransferOperation
  | BankSendOperation;

interface BaseOperation {
  tx_index: number;
  amount_in: string;
  amount_out: string;
}

export interface TransferOperation extends BaseOperation {
  transfer: {
    port: string;
    channel: string;
    chain_id: string;
    pfm_enabled: boolean;
    dest_denom: string;
    supports_memo: boolean;
    bridge_id?: string;
    denom_in: string;
    denom_out: string;
    from_chain_id: string;
    to_chain_id: string;
    smart_relay?: boolean;
  };
}

export interface SwapOperation extends BaseOperation {
  swap: {
    swap_in: {
      swap_venue: SwapVenue;
      swap_operations: {
        pool: string;
        denom_in: string;
        denom_out: string;
      }[];
      swap_amount_in: string;
      price_impact_percent?: string;
    };
    estimated_affiliate_fee?: string;
  };
}

export interface EvmSwapOperation extends BaseOperation {
  evm_swap: {
    input_token: string;
    amount_in: string;
    swap_calldata: string;
    amount_out: string;
    from_chain_id: string;
    denom_in: string;
    denom_out: string;
    swap_venues: SwapVenue[];
  };
}

export interface AxelarTransferOperation extends BaseOperation {
  axelar_transfer: {
    from_chain_id: string;
    to_chain_id: string;
    asset: string;
    denom_in: string;
    denom_out: string;
    fee_amount: string;
    fee_asset: AssetInfo;
    is_testnet: boolean;
    should_unwrap: boolean;
    bridge_id: string;
    smart_relay?: boolean;
  };
}

export interface CCTPTransferOperation extends BaseOperation {
  cctp_transfer: {
    from_chain_id: string;
    to_chain_id: string;
    burn_token: string;
    denom_in: string;
    denom_out: string;
    bridge_id: string;
    smart_relay?: boolean;
  };
}

export interface HyperlaneTransferOperation extends BaseOperation {
  hyperlane_transfer: {
    from_chain_id: string;
    to_chain_id: string;
    denom_in: string;
    denom_out: string;
    hyperlane_contract_address: string;
    fee_amount: string;
    fee_asset: AssetInfo;
    bridge_id: string;
    smart_relay?: boolean;
  };
}

export interface GoFastTransferOperation extends BaseOperation {
  go_fast_transfer: {
    from_chain_id: string;
    to_chain_id: string;
    denom_in: string;
    denom_out: string;
    bridge_id: string;
    smart_relay?: boolean;
  };
}

export interface StargateTransferOperation extends BaseOperation {
  stargate_transfer: {
    from_chain_id: string;
    to_chain_id: string;
    denom_in: string;
    denom_out: string;
    bridge_id: string;
    smart_relay?: boolean;
  };
}

export interface LayerZeroTransferOperation extends BaseOperation {
  layer_zero_transfer: {
    from_chain_id: string;
    to_chain_id: string;
    denom_in: string;
    denom_out: string;
    bridge_id: string;
    smart_relay?: boolean;
  };
}

export interface EurekaTransferOperation extends BaseOperation {
  eureka_transfer: {
    from_chain_id: string;
    to_chain_id: string;
    denom_in: string;
    denom_out: string;
    bridge_id: string;
    channel: string;
    dest_port: string;
    smart_relay?: boolean;
  };
}

export interface BankSendOperation extends BaseOperation {
  bank_send: {
    chain_id: string;
    denom: string;
  };
}

// ─── Messages Request / Response ───────────────────────────────────

export interface MessagesRequest {
  source_asset_denom: string;
  source_asset_chain_id: string;
  dest_asset_denom: string;
  dest_asset_chain_id: string;
  amount_in: string;
  amount_out: string;
  address_list: string[];
  operations: Operation[];
  estimated_amount_out?: string;
  slippage_tolerance_percent: string;
  enable_gas_warnings?: boolean;
  smart_relay?: boolean;
}

export interface MessagesResponse {
  msgs: MessageWrapper[];
  txs: TransactionWrapper[];
  estimated_fees?: EstimatedFee[];
  warning?: {
    type: string;
    message: string;
  };
}

export interface MessageWrapper {
  chain_id: string;
  path: string[];
  msg: string;
  msg_type_url: string;
}

export interface TransactionWrapper {
  cosmos_tx?: CosmosTx;
  evm_tx?: EvmTx;
  svm_tx?: SvmTx;
  operations_indices: number[];
}

export interface CosmosTx {
  chain_id: string;
  path: string[];
  msgs: {
    msg: string;
    msg_type_url: string;
  }[];
  signer_address: string;
}

export interface EvmTx {
  chain_id: string;
  to: string;
  value: string;
  data: string;
  signer_address: string;
  required_erc20_approvals?: {
    token_contract: string;
    spender: string;
    amount: string;
  }[];
}

export interface SvmTx {
  chain_id: string;
  tx: string; // base64 encoded
  signer_address: string;
}

// ─── Transaction Tracking ──────────────────────────────────────────

export type TxState =
  | "STATE_SUBMITTED"
  | "STATE_PENDING"
  | "STATE_COMPLETED_SUCCESS"
  | "STATE_COMPLETED_ERROR"
  | "STATE_ABANDONED"
  | "STATE_PENDING_ERROR";

export type TransferState =
  | "TRANSFER_UNKNOWN"
  | "TRANSFER_PENDING"
  | "TRANSFER_RECEIVED"
  | "TRANSFER_SUCCESS"
  | "TRANSFER_FAILURE";

export interface TxStatusResponse {
  status: TxState;
  transfer_sequence: TransferEvent[];
  next_blocking_transfer?: {
    transfer_sequence_index: number;
  };
  transfer_asset_release?: {
    chain_id: string;
    denom: string;
    amount: string;
    released: boolean;
  };
  error?: {
    message: string;
    type: string;
  };
}

export interface TransferEvent {
  src_chain_id: string;
  dst_chain_id: string;
  state: TransferState;
  packet_txs: {
    send_tx?: TxInfo;
    receive_tx?: TxInfo;
    acknowledge_tx?: TxInfo;
    timeout_tx?: TxInfo;
    error?: {
      message: string;
      type: string;
    };
  };
}

export interface TxInfo {
  chain_id: string;
  tx_hash: string;
  explorer_link?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────

/** Extract the operation type key from an Operation */
export function getOperationType(op: Operation): string {
  if ("transfer" in op) return "IBC Transfer";
  if ("swap" in op) return "Swap";
  if ("evm_swap" in op) return "EVM Swap";
  if ("axelar_transfer" in op) return "Axelar";
  if ("cctp_transfer" in op) return "CCTP";
  if ("hyperlane_transfer" in op) return "Hyperlane";
  if ("go_fast_transfer" in op) return "GoFast";
  if ("stargate_transfer" in op) return "Stargate";
  if ("layer_zero_transfer" in op) return "LayerZero";
  if ("eureka_transfer" in op) return "Eureka";
  if ("bank_send" in op) return "Bank Send";
  return "Unknown";
}

/** Extract from/to chain IDs from an operation */
export function getOperationChains(op: Operation): {
  from: string;
  to: string;
} {
  if ("transfer" in op) return { from: op.transfer.from_chain_id, to: op.transfer.to_chain_id };
  if ("swap" in op)
    return {
      from: op.swap.swap_in.swap_venue.chain_id,
      to: op.swap.swap_in.swap_venue.chain_id,
    };
  if ("evm_swap" in op)
    return {
      from: op.evm_swap.from_chain_id,
      to: op.evm_swap.from_chain_id,
    };
  if ("axelar_transfer" in op)
    return {
      from: op.axelar_transfer.from_chain_id,
      to: op.axelar_transfer.to_chain_id,
    };
  if ("cctp_transfer" in op)
    return {
      from: op.cctp_transfer.from_chain_id,
      to: op.cctp_transfer.to_chain_id,
    };
  if ("hyperlane_transfer" in op)
    return {
      from: op.hyperlane_transfer.from_chain_id,
      to: op.hyperlane_transfer.to_chain_id,
    };
  if ("go_fast_transfer" in op)
    return {
      from: op.go_fast_transfer.from_chain_id,
      to: op.go_fast_transfer.to_chain_id,
    };
  if ("stargate_transfer" in op)
    return {
      from: op.stargate_transfer.from_chain_id,
      to: op.stargate_transfer.to_chain_id,
    };
  if ("layer_zero_transfer" in op)
    return {
      from: op.layer_zero_transfer.from_chain_id,
      to: op.layer_zero_transfer.to_chain_id,
    };
  if ("eureka_transfer" in op)
    return {
      from: op.eureka_transfer.from_chain_id,
      to: op.eureka_transfer.to_chain_id,
    };
  if ("bank_send" in op) return { from: op.bank_send.chain_id, to: op.bank_send.chain_id };
  return { from: "", to: "" };
}

/** Extract denom in/out from an operation */
export function getOperationDenoms(op: Operation): {
  denomIn: string;
  denomOut: string;
} {
  if ("transfer" in op) return { denomIn: op.transfer.denom_in, denomOut: op.transfer.denom_out };
  if ("swap" in op) {
    const ops = op.swap.swap_in.swap_operations;
    return {
      denomIn: ops[0]?.denom_in ?? "",
      denomOut: ops[ops.length - 1]?.denom_out ?? "",
    };
  }
  if ("evm_swap" in op)
    return {
      denomIn: op.evm_swap.denom_in,
      denomOut: op.evm_swap.denom_out,
    };
  if ("axelar_transfer" in op)
    return {
      denomIn: op.axelar_transfer.denom_in,
      denomOut: op.axelar_transfer.denom_out,
    };
  if ("cctp_transfer" in op)
    return {
      denomIn: op.cctp_transfer.denom_in,
      denomOut: op.cctp_transfer.denom_out,
    };
  if ("hyperlane_transfer" in op)
    return {
      denomIn: op.hyperlane_transfer.denom_in,
      denomOut: op.hyperlane_transfer.denom_out,
    };
  if ("go_fast_transfer" in op)
    return {
      denomIn: op.go_fast_transfer.denom_in,
      denomOut: op.go_fast_transfer.denom_out,
    };
  if ("stargate_transfer" in op)
    return {
      denomIn: op.stargate_transfer.denom_in,
      denomOut: op.stargate_transfer.denom_out,
    };
  if ("layer_zero_transfer" in op)
    return {
      denomIn: op.layer_zero_transfer.denom_in,
      denomOut: op.layer_zero_transfer.denom_out,
    };
  if ("eureka_transfer" in op)
    return {
      denomIn: op.eureka_transfer.denom_in,
      denomOut: op.eureka_transfer.denom_out,
    };
  if ("bank_send" in op) return { denomIn: op.bank_send.denom, denomOut: op.bank_send.denom };
  return { denomIn: "", denomOut: "" };
}
