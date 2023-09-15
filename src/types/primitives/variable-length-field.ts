import {
  bigIntToLEBytes,
  byteToBits,
  leBytesToUint8Array,
  uint8ArrayToLeBytes,
} from "../../converter/numeric.js";

export default class VariableLengthField {
  private _length: number;
  private _value: Uint8Array;
  constructor(value: Uint8Array) {
    this._length = value.length;
    this._value = new Uint8Array(this._length);
    this._value.set(value);
  }

  static fromLEBytes(leBytes: Array<BigInt>) {
    return new VariableLengthField(leBytesToUint8Array(leBytes));
  }

  static fromBigInt(num: BigInt) {
    let leBytes = bigIntToLEBytes(num);
    return VariableLengthField.fromLEBytes(leBytes);
  }

  static fromSSZ(ssz: string, length: number) {
    let value = [];

    let paddedSSZ = ssz.substring(2).padStart(2 * length, "0");
    for (let i = 0; i < 2 * length; i += 2) {
      let str = paddedSSZ.substring(i, i + 2);
      value.push(parseInt(str, 16));
    }
    return new VariableLengthField(new Uint8Array(value));
  }

  static zero(length: number) {
    return new VariableLengthField(new Uint8Array(length));
  }

  get value() {
    return this._value;
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

  get sumBits() {
    return this.leBits.reduce((sum, bit) => sum + (bit ? 1 : 0), 0);
  }

  get ssz() {
    let res = "0x";
    for (let i = 0; i < this._length; i++) {
      res += this._value[i].toString(16).padStart(2, "0");
    }
    return res;
  }

  clone() {
    return new VariableLengthField(this._value);
  }
}
