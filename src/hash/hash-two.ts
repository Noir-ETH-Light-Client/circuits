import { sha256 } from "js-sha256";
import Field from "../types/field.js";

export default function hashTwo(input0: Field, input1: Field): Field {
  let hash = sha256.create();
  hash.update([...input0.value, ...input1.value]);
  return new Field(new Uint8Array(hash.digest()));
}
