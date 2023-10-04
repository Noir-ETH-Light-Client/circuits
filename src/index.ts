export interface BeaconHeaderObject {
  slot: string;
  proposer_index: string;
  parent_root: string;
  state_root: string;
  body_root: string;
}

export interface LightClientUpdateObject {
  attested_header: LightClientHeaderObject;
  next_sync_committee: SyncCommitteeObject;
  next_sync_committee_branch: string[];
  finalized_header: LightClientHeaderObject;
  finality_branch: string[];
  sync_aggregate: {
    sync_committee_bits: string;
    sync_committee_signature: string;
  };
  signature_slot: string;
}

export interface LightClientStoreObject {
  finalized_header: LightClientHeaderObject;
  optimistic_header: LightClientHeaderObject;
  sync_committees: Map<number, SyncCommitteeObject>;
  best_valid_updates: Map<number, LightClientUpdateObject>;
  max_active_participants: Map<number, number>;
}

export interface LightClientHeaderObject {
  execution?: ExecutionPayloadHeaderObject;
  execution_branch?: string[];
  beacon: BeaconHeaderObject;
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

export interface NoirSolidityProof {
  slicedProof: Uint8Array;
  publicInputs: Uint8Array[];
}

export { default as Field } from "./primitives/field.js";
export { default as VariableLengthField } from "./primitives/variable-length-field.js";
export { default as executionHashTreeRoot } from "./hash/hash-execution.js";
export { default as hashMerkleBranch } from "./hash/hash-merkle-brach.js";
export { default as hashTreeRoot } from "./hash/hash-tree-root.js";
export { default as hashTwo } from "./hash/hash-two.js";
export { default as computeDomain } from "./domain/compute-domain.js";
export { validateWitness, generateProof } from "./berretenberg-api/index.js";
export { default as BeaconAPI } from "./beacon-api/index.js";
export { default as BeaconHeader } from "./beacon/beacon-header.js";
export { default as BLSPubKey } from "./beacon/bls-pubkey.js";
export { default as BLSSignature } from "./beacon/bls-signature.js";
export { default as SyncCommittee } from "./beacon/sync-committee.js";
export * as constants from "./constants/index.js";
export * as numericConverter from "./converter/numeric.js";
export * as timeConverter from "./converter/time.js";
export {
  isBetterUpdate,
  isLightClientUpdateSafe,
} from "./light-client/is-better-lc-update.js";
export { default as LightClientBootstrap } from "./light-client/lc-bootstrap.js";
export { default as LightClientHeader } from "./light-client/lc-header.js";
export { default as LightClientStore } from "./light-client/lc-store.js";
export { default as LightClientUpdate } from "./light-client/lc-update.js";
