export interface BeaconHeaderObject {
  slot: string;
  proposer_index: string;
  parent_root: string;
  state_root: string;
  body_root: string;
}

export interface SyncCommitteeObject {
  pubkeys: Array<string>;
  aggregate_pubkey: string;
}

export interface ExecutionPayloadHeaderObject {
  parent_hash: string;
  fee_recipient: string;
  state_root: string;
  receipts_root: string;
  logs_bloom: string;
  prev_randao: string;
  block_number: string;
  gas_limit: string;
  gas_used: string;
  timestamp: string;
  extra_data: string;
  base_fee_per_gas: string;
  block_hash: string;
  transactions_root: string;
  withdrawals_root: string;
}
