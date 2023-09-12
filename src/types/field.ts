import {
  bigIntToHilo,
  bigIntToLEBytes,
  byteToBits,
  hiloToBigInt,
  leBytesToBigInt,
  leBytesToUint8Array,
  uint8ArrayToLeBytes,
} from "../converter/index.js";

export default class Field {
  private _value: Uint8Array;
  constructor(value: Uint8Array) {
    this._value = new Uint8Array(32);
    this._value.set(value);
  }

  static fromHilo(hi: BigInt, lo: BigInt) {
    let bigInt = hiloToBigInt(hi, lo);
    return Field.fromBigInt(bigInt);
  }

  static fromLEBytes(leBytes: Array<BigInt>) {
    return new Field(leBytesToUint8Array(leBytes));
  }

  static fromBigInt(num: BigInt) {
    let leBytes = bigIntToLEBytes(num);
    return Field.fromLEBytes(leBytes);
  }


  static fromSSZ(ssz: string) {
    let value = [];

    let paddedSSZ = ssz.substring(2).padStart(64, "0");
    for (let i = 0; i < 64; i += 2) {
      let str = paddedSSZ.substring(i, i + 2);
      value.push(parseInt(str, 16));
    }
    return new Field(new Uint8Array(value));
  }

  static zero() {
    return new Field(new Uint8Array());
  }

  get value() {
    return this._value;
  }

  get hilo() {
    return bigIntToHilo(this.bigInt);
  }

  get leBytes() {
    return uint8ArrayToLeBytes(this._value);
  }

  get leBits() {
    return this._value.reduce(
      (res: boolean[], v) => [...res, ...byteToBits(v)],
      []
    );
  }

  get bigInt() {
    return leBytesToBigInt(this.leBytes);
  }

  get hex() {
    return this.bigInt.toString(16);
  }

  get ssz() {
    let res = "0x";
    for (let i = 0; i < 32; i++) {
      res += this._value[i].toString(16).padStart(2, "0");
    }
    return res;
  }

  clone() {
    return new Field(this._value);
  }
}
