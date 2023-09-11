import {
  fieldToHilo,
  fieldToLEBits,
  fieldToLEBytes,
  hiloToField,
  leBytesToField,
  leBytesToUint8Array,
  uint8ArrayToLeBytes,
} from "../converter/index.js";

export default class Field {
  private _value: BigInt;
  constructor(value: BigInt) {
    this._value = value;
  }

  static fromHilo(hi: BigInt, lo: BigInt) {
    return new Field(hiloToField(hi, lo));
  }

  static fromLEBytes(leBytes: Array<BigInt>) {
    return new Field(leBytesToField(leBytes));
  }

  static fromUint8Array(uint8Array: Uint8Array) {
    return Field.fromLEBytes(uint8ArrayToLeBytes(uint8Array));
  }

  static zero() {
    return new Field(0n);
  }

  get valueOf() {
    return this._value;
  }

  set value(value: BigInt) {
    this._value = value;
  }

  get hilo() {
    return fieldToHilo(this._value);
  }

  get leBytes() {
    return fieldToLEBytes(this._value);
  }

  get uint8Array() {
    return leBytesToUint8Array(this.leBytes);
  }

  get leBits() {
    return fieldToLEBits(this._value);
  }

  get hex() {
    return this._value.toString(16);
  }

  clone() {
    return new Field(this._value);
  }

  add(other: BigInt) {
    return new Field(this._value.valueOf() + other.valueOf());
  }

  sub(other: BigInt) {
    return new Field(this._value.valueOf() - other.valueOf());
  }
}
