import hashTreeRoot from "../hash/hash-tree-root.js";
import { BeaconHeaderObject } from "../index.js";
import Field from "../primitives/field.js";

export default class BeaconHeader {
  private _slot: Field;
  private _proposerIndex: Field;
  private _parentRoot: Field;
  private _stateRoot: Field;
  private _bodyRoot: Field;

  constructor({
    slot,
    proposer_index,
    parent_root,
    state_root,
    body_root,
  }: BeaconHeaderObject) {
    this._slot = Field.fromBigInt(BigInt(slot));
    this._proposerIndex = Field.fromBigInt(BigInt(proposer_index));
    this._parentRoot = Field.fromSSZ(parent_root);
    this._stateRoot = Field.fromSSZ(state_root);
    this._bodyRoot = Field.fromSSZ(body_root);
  }

  get slot() {
    return this._slot;
  }

  get proposerIndex() {
    return this._proposerIndex;
  }

  get parentRoot() {
    return this._parentRoot;
  }

  get stateRoot() {
    return this._stateRoot;
  }

  get bodyRoot() {
    return this._bodyRoot;
  }

  get hashTreeRoot() {
    return hashTreeRoot([
      this._slot,
      this._proposerIndex,
      this._parentRoot,
      this._stateRoot,
      this._bodyRoot,
    ]);
  }

  isZeroed() {
    let zero = Field.zero();
    return this._bodyRoot.isEqual(zero);
  }
}
