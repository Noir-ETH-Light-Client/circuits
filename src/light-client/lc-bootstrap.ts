import { SyncCommitteeObject } from "src/index.js";
import SyncCommittee from "../beacon/sync-committee.js";
import Field from "../primitives/field.js";
import LightClientHeader from "./lc-header.js";
import {
  SYNC_COMMITTEES_DEPTH,
  SYNC_COMMITTEES_INDEX,
} from "../constants/index.js";
import hashMerkleBranch from "../hash/hash-merkle-brach.js";

export default class LightClientBootstrap {
  readonly header: LightClientHeader;
  readonly currentSyncCommittee: SyncCommittee;
  readonly currentSyncCommitteeBranch: Array<Field>;

  constructor(
    header: LightClientHeader,
    current_sync_committee: SyncCommitteeObject,
    current_sync_committee_branch: Array<string>
  ) {
    if (current_sync_committee_branch.length !== SYNC_COMMITTEES_DEPTH)
      throw new Error(
        `Expect the current sync committee branch length to be ${SYNC_COMMITTEES_DEPTH}, but got ${current_sync_committee_branch.length}`
      );
    this.header = header;
    this.currentSyncCommittee = new SyncCommittee(current_sync_committee);
    this.currentSyncCommitteeBranch = current_sync_committee_branch.map(
      (node) => Field.fromSSZ(node)
    );
  }
  
  isValid(trustedBlockRoot: Field) {
    const beaconRoot = this.header.beacon.hashTreeRoot;
    if (!beaconRoot.isEqual(trustedBlockRoot)) return false;
    if (!this.header.isValid()) return false;
    const index = Field.fromBigInt(BigInt(SYNC_COMMITTEES_INDEX));
    const expectedStateRoot = hashMerkleBranch(
      this.currentSyncCommittee.hashTreeRoot,
      this.currentSyncCommitteeBranch,
      index
    );
    return expectedStateRoot.isEqual(this.header.beacon.stateRoot);
  }
}
