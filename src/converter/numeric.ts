export function uint8ArrayToBigInt(uint8Array: Uint8Array): BigInt {
  let result = 0n;
  let mul2 = 1n;
  for (let i = 0; i < uint8Array.length; i++) {
    result += BigInt(uint8Array[i]) * mul2;
    mul2 <<= 8n;
  }

  return result;
}

export function bigIntToLEBytes(field: BigInt) {
  let curField = BigInt(field.valueOf());

  let leBytes = new Array<BigInt>(32);
  for (let i = 0; i < 32; i++) {
    leBytes[i] = curField % 256n;
    curField >>= 8n;
  }
  return leBytes;
}

export function leBytesToBigInt(leBytes: Array<BigInt>) {
  let bytes = [...leBytes];
  if (bytes.length < 32) {
    for (let i = bytes.length; i < 32; i++) {
      bytes.push(0n);
    }
  }
  let field = 0n;
  let mul2 = 1n;
  for (let i = 0; i < 32; i++) {
    field += mul2 * bytes[i].valueOf();
    mul2 <<= 8n;
  }
  return field;
}

export function bigIntToHilo(field: BigInt) {
  let hi = BigInt(field.valueOf() >> 128n);
  let lo = BigInt(field.valueOf() - (hi.valueOf() << 128n));
  return [hi, lo];
}

export function hiloToBigInt(hi: BigInt, lo: BigInt) {
  return BigInt((hi.valueOf() << 128n) + lo.valueOf());
}

export function leBytesToUint8Array(leBytes: Array<BigInt>): Uint8Array {
  return new Uint8Array(leBytes.map((b) => Number(b)));
}

export function uint8ArrayToLeBytes(uint8Array: Uint8Array): Array<BigInt> {
  let arr = [];
  for (let i = 0; i < uint8Array.length; i++) {
    arr.push(BigInt(uint8Array[i]));
  }
  return arr;
}

export function convertToHexAndPad(val: any) {
  var res;
  if (val instanceof Uint8Array) res = uint8ArrayToBigInt(val).toString(16);
  else res = BigInt(val).toString(16);
  return `0x${"0".repeat(64 - res.length)}${res}`;
}

export function byteToBits(byte: number) {
  let res: boolean[] = new Array();
  let curByte = byte;
  for (let i = 0; i < 8; i++) {
    let bit = curByte % 2;
    res.push(bit === 1);
    curByte >>= 1;
  }
  return res;
}