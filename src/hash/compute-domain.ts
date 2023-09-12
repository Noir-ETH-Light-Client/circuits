import Field from "../types/field.js";
import hashTwo from "./hash-two.js";
import {
  uint8ArrayToLeBytes,
} from "../converter/index.js";

export default function computeDomain(fork_version: Uint8Array, GENESIS_VALIDATORS_ROOT: Field, DOMAIN_SYNC_COMMITTEE: Uint8Array): Field {
  let fork_version_uint8Array = new Uint8Array(32);
  for(let i = 0; i < 4; i++) {
    fork_version_uint8Array[i] = fork_version[i];
  }
  for(let i = 4; i < 32; i++) {
    fork_version_uint8Array[i] = 0;
  }

  let fork_version_bytes = Field.fromLEBytes(uint8ArrayToLeBytes(fork_version_uint8Array));

  let hash_two = hashTwo(fork_version_bytes, GENESIS_VALIDATORS_ROOT);

  let hash_two_uint8Array = [...hash_two.value];
  let domain_uint8Array = new Uint8Array(32);
  
  for(let i = 0; i < 4; i++) {
    domain_uint8Array[i] = DOMAIN_SYNC_COMMITTEE[i];
  }
  for(let i = 4; i < 32; i++) {
    domain_uint8Array[i] = hash_two_uint8Array[i-4];
  }

  let domain = Field.fromLEBytes(uint8ArrayToLeBytes(domain_uint8Array));
  return domain
}
