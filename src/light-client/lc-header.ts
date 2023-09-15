import {
  CAPELLA_FORK_VERSION,
  EXECUTION_PAYLOAD_DEPTH,
  EXECUTION_PAYLOAD_INDEX,
} from "../constants/index.js";
import {
  BeaconHeaderObject,
  ExecutionPayloadHeaderObject,
} from "../index.js";
import { slotToForkVersion } from "../converter/time.js";
import executionHashTreeRoot from "../hash/hash-execution.js";
import Field from "../primitives/field.js";
import hashMerkleBranch from "../hash/hash-merkle-brach.js";
import BeaconHeader from "../beacon/beacon-header.js";

export default class LightClientHeader {
  private _beacon: BeaconHeader;
  private _execution?: ExecutionPayloadHeaderObject;
  private _executionBranch?: Array<Field>;

  constructor(
    beacon: BeaconHeaderObject,
    execution?: ExecutionPayloadHeaderObject,
    executionBranch?: Array<string>
  ) {
    if (executionBranch && executionBranch.length !== EXECUTION_PAYLOAD_DEPTH) {
      throw new Error(
        `Expect the execution branch length to be ${EXECUTION_PAYLOAD_DEPTH}, but got ${executionBranch.length}`
      );
    }
    this._beacon = new BeaconHeader(beacon);
    this._execution = execution;
    this._executionBranch = executionBranch?.map((node) => Field.fromSSZ(node));
  }
  get beacon() {
    return this._beacon;
  }
  get execution() {
    return this._execution;
  }
  get executionBranch() {
    return this._executionBranch;
  }
  isValid() {
    const slot = Number(this._beacon.slot.bigInt);
    const forkVersion = slotToForkVersion(slot);
    if (forkVersion !== CAPELLA_FORK_VERSION) {
      return !this._execution && !this._executionBranch;
    }
    if (!this._execution || !this._executionBranch) return false;
    const executionRoot = executionHashTreeRoot(this._execution);

    const index = Field.fromBigInt(BigInt(EXECUTION_PAYLOAD_INDEX));
    const expectedBodyRoot = hashMerkleBranch(
      executionRoot,
      this._executionBranch,
      index
    );
    return expectedBodyRoot.ssz === this._beacon.bodyRoot.ssz;
  }
}
