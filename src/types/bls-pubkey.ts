import hashTreeRoot from "../hash/hash-tree-root.js";
import Field from "./field.js";

export default class BLSPubKey {
  private _value: Uint8Array;
  constructor(value: Uint8Array) {
    this._value = new Uint8Array(48);
    this._value.set(value);
  }

  static fromSSZ(ssz: string) {
    let value = [];

    let paddedSSZ = ssz.substring(2).padStart(96, "0");
    for (let i = 0; i < 96; i += 2) {
      let str = paddedSSZ.substring(i, i + 2);
      value.push(parseInt(str, 16));
    }
    return new BLSPubKey(new Uint8Array(value));
  }

  get ssz() {
    let res = "0x";
    for (let i = 0; i < 48; i++) {
      res += this._value[i].toString(16).padStart(2, "0");
    }
    return res;
  }

  get hashTreeRoot() {
    const leaf0 = new Field(this._value.slice(0, 32));
    const leaf1 = new Field(this._value.slice(32));
    return hashTreeRoot([leaf0, leaf1]);
  }
}
