import bls from "@chainsafe/bls";
import hashTreeRoot from "../hash/hash-tree-root.js";
import Field from "../primitives/field.js";
import {
  bigIntToHilo,
  leBytesToBigInt,
  uint8ArrayToLeBytes,
} from "../converter/numeric.js";

export default class BLSPubKey {
  readonly value: Uint8Array;
  constructor(value: Uint8Array) {
    this.value = new Uint8Array(48);
    this.value.set(value);
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

  get hilo() {
    return bigIntToHilo(this.bigInt, 192);
  }

  get leBytes() {
    return uint8ArrayToLeBytes(this.value);
  }

  get bigInt() {
    return leBytesToBigInt(this.leBytes, 48);
  }

  get ssz() {
    let res = "0x";
    for (let i = 0; i < 48; i++) {
      res += this.value[i].toString(16).padStart(2, "0");
    }
    return res;
  }

  get hashTreeRoot() {
    const leaf0 = new Field(this.value.slice(0, 32));
    const leaf1 = new Field(this.value.slice(32));
    return hashTreeRoot([leaf0, leaf1]);
  }

  get contractData() {
    const first = this.value.slice(0, 32);
    const second = new Uint8Array(32);
    second.set(this.value.slice(32));
    return [first, second];
  }

  get chainsafePubkey() {
    return bls.PublicKey.fromBytes(this.value);
  }
}
