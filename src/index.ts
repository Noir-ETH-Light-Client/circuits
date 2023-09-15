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

export enum InvalidLCMessage {
  MIN_SYNC_COMMITTEE_PARTICIPANTS_NOT_MET = "Sync committee has not sufficient participants",
  INVALID_ATTESTED_HEADER = "Attested Header is not Valid Light Client Header",
  SIGNATURE_SLOT_MUST_BE_AFTER_ATTESTED_SLOT = "The signature slot must be after the attested header slot",
  ATTESTED_SLOT_MUST_BE_AFTER_FINALIZED_SLOT = "The attested header slot must be after the finalized header slot",
  INVALID_FINALITY_UPDATE = "Invalid finality information",
  INVALID_SYNC_COMMITTEE_UPDATE = "Invalid next sync committee information",
  INVALID_AGGREGATE_SIGNATURE = "Invalid aggregate signature",
}
export interface IsLCUpdateValid {
  valid: boolean;
  msg?: InvalidLCMessage;
}

export interface LightClientUpdateSummary {
  activeParticipants: number;
  attestedHeaderSlot: number;
  signatureSlot: number;
  finalizedHeaderSlot: number;
  isSyncCommitteeUpdate: boolean;
  isFinalityUpdate: boolean;
}