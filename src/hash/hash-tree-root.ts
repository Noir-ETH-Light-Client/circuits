import Field from "../primitives/field.js";
import hashTwo from "./hash-two.js";

function nextPowerOfTwo(num: number): number {
  if (num > 0 && (num & (num - 1)) === 0) return num;
  let result = 1;

  while (num > 0) {
    result = result << 1;
    num = num >> 1;
  }
  return result;
}

export default function hashTreeRoot(leaves: Array<Field>): Field {
  let nLeaves = leaves.length;
  let nextPowerOf2 = nextPowerOfTwo(nLeaves);
  let paddedLeaves = [...leaves];
  for (let i = nLeaves; i < nextPowerOf2; i++) paddedLeaves.push(Field.zero());

  let hashes = new Array(nextPowerOf2 - 1);
  for (let i = 0; i < nextPowerOf2 / 2; i++) {
    hashes[i] = hashTwo(paddedLeaves[2 * i], paddedLeaves[2 * i + 1]);
  }
  let k = 0;
  for (let i = nextPowerOf2 / 2; i < nextPowerOf2 - 1; i++) {
    hashes[i] = hashTwo(hashes[2 * k], hashes[2 * k + 1]);
    k++;
  }
  return hashes[nextPowerOf2 - 2];
}
