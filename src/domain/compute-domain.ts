import { slotToForkVersion } from "src/converter/time";
import Field from "../types/primitives/field.js";
import hashTwo from "../hash/hash-two.js";
import { DOMAIN_SYNC_COMMITTEE } from "src/constants";

export default function computeDomain(
  slot: number,
  genesisValidatorRoot: Field
) {
  const forkVersion = Field.fromBigInt(BigInt(slotToForkVersion(slot)));
  const forkDataRoot = hashTwo(forkVersion, genesisValidatorRoot);
  const domain = new Uint8Array(32);
  domain.set(DOMAIN_SYNC_COMMITTEE, 0);
  domain.set(forkDataRoot.value.slice(0, 28), 4);
  return new Field(domain);
}
