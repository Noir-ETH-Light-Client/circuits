import hashTreeRoot from "../hash/hash-tree-root.js";
import { BeaconHeaderObject } from "../index.js";
import Field from "../primitives/field.js";

export default class BeaconHeader {
  readonly slot: Field;
  readonly proposerIndex: Field;
  readonly parentRoot: Field;
  readonly stateRoot: Field;
  readonly bodyRoot: Field;

  constructor({
    slot,
    proposer_index,
    parent_root,
    state_root,
    body_root,
  }: BeaconHeaderObject) {
    this.slot = Field.fromBigInt(BigInt(slot));
    this.proposerIndex = Field.fromBigInt(BigInt(proposer_index));
    this.parentRoot = Field.fromSSZ(parent_root);
    this.stateRoot = Field.fromSSZ(state_root);
    this.bodyRoot = Field.fromSSZ(body_root);
  }

  get hashTreeRoot() {
    return hashTreeRoot([
      this.slot,
      this.proposerIndex,
      this.parentRoot,
      this.stateRoot,
      this.bodyRoot,
    ]);
  }

  isZeroed() {
    let zero = Field.zero();
    return this.bodyRoot.isEqual(zero);
  }

  get flat() {
    return [
      this.slot.bigInt,
      this.proposerIndex.bigInt,
      ...this.parentRoot.hilo,
      ...this.stateRoot.hilo,
      ...this.bodyRoot.hilo,
    ];
  }
}
