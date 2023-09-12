import Field from "../types/field.js";
import hashTwo from "./hash-two.js";

export default function computeSigningRoot(headerHash: Field, domain: Field): Field {
  let signing_root = hashTwo(headerHash, domain);
  return signing_root
}
