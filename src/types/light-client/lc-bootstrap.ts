import { SyncCommitteeObject } from "src/index.js";
import SyncCommittee from "../beacon/sync-committee.js";
import Field from "../primitives/field.js";
import LightClientHeader from "./lc-header.js";
import {
  SYNC_COMMITTEES_DEPTH,
  SYNC_COMMITTEES_INDEX,
} from "src/constants/index.js";
import hashMerkleBranch from "../../hash/hash-merkle-brach.js";

export default class LightClientBootstrap {
  private _header: LightClientHeader;
  private _current_sync_committee: SyncCommittee;
  private _current_sync_committee_branch: Array<Field>;

  constructor(
    header: LightClientHeader,
    current_sync_committee: SyncCommitteeObject,
    current_sync_committee_branch: Array<string>
  ) {
    if (current_sync_committee_branch.length !== SYNC_COMMITTEES_DEPTH)
      throw new Error(
        `Expect the current sync committee branch length to be ${SYNC_COMMITTEES_DEPTH}, but got ${current_sync_committee_branch.length}`
      );
    this._header = header;
    this._current_sync_committee = new SyncCommittee(current_sync_committee);
    this._current_sync_committee_branch = current_sync_committee_branch.map(
      (node) => Field.fromSSZ(node)
    );
  }
  
  isValid(trustedBlockRoot: Field) {
    const beaconRoot = this._header.beacon.hashTreeRoot;
    if (!beaconRoot.isEqual(trustedBlockRoot)) return false;
    if (!this._header.isValid()) return false;
    const index = Field.fromBigInt(BigInt(SYNC_COMMITTEES_INDEX));
    const expectedStateRoot = hashMerkleBranch(
      this._current_sync_committee.hashTreeRoot,
      this._current_sync_committee_branch,
      index
    );
    return expectedStateRoot.isEqual(this._header.beacon.stateRoot);
  }
}
