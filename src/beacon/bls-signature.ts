import bls from "@chainsafe/bls";
import hashTreeRoot from "../hash/hash-tree-root.js";
import Field from "../primitives/field.js";

export default class BLSSignature {
  readonly value: Uint8Array;
  constructor(value: Uint8Array) {
    this.value = new Uint8Array(96);
    this.value.set(value);
  }

  static fromSSZ(ssz: string) {
    let value = [];

    let paddedSSZ = ssz.substring(2).padStart(192, "0");
    for (let i = 0; i < 192; i += 2) {
      let str = paddedSSZ.substring(i, i + 2);
      value.push(parseInt(str, 16));
    }
    return new BLSSignature(new Uint8Array(value));
  }

  get ssz() {
    let res = "0x";
    for (let i = 0; i < 96; i++) {
      res += this.value[i].toString(16).padStart(2, "0");
    }
    return res;
  }

  get hashTreeRoot() {
    const leaf0 = new Field(this.value.slice(0, 32));
    const leaf1 = new Field(this.value.slice(32, 64));
    const leaf2 = new Field(this.value.slice(64));
    return hashTreeRoot([leaf0, leaf1, leaf2]);
  }

  get chainsafeSignature() {
    return bls.Signature.fromBytes(this.value);
  }
}
