import { sha256 } from "js-sha256";
import Field from "../types/field.js";

export default function hashTwo(input0: Field, input1: Field): Field {
  let hash = sha256.create();
  hash.update([...input0.uint8Array, ...input1.uint8Array]);
  return Field.fromUint8Array(new Uint8Array(hash.digest()));
}
