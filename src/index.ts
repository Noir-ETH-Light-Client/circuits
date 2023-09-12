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
