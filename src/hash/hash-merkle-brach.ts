import Field from "../types/field.js";
import hashTwo from "./hash-two.js";

export default function hashMerkleBranch(
  leaf: Field,
  branch: Array<Field>,
  index: Field
): Field {
  let bits = index.leBits;
  if (bits.length < branch.length)
    for (let i = bits.length; i < branch.length; i++) bits.push(false);
  let cur = leaf.clone();
  for (let i = 0; i < branch.length; i++) {
    if (bits[i]) {
      cur = hashTwo(branch[i], cur);
    } else {
      cur = hashTwo(cur, branch[i]);
    }
  }
  return cur;
}
