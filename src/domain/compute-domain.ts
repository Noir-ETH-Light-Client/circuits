import { slotToForkVersion } from "../converter/time.js";
import Field from "../types/primitives/field.js";
import hashTwo from "../hash/hash-two.js";
import { DOMAIN_SYNC_COMMITTEE } from "../constants/index.js";

export default function computeDomain(
  slot: number,
  genesisValidatorsRoot: Field
) {
  const forkVersion = Field.fromSSZ(slotToForkVersion(slot), 4);
  const forkDataRoot = hashTwo(forkVersion, genesisValidatorsRoot);
  const domain = new Uint8Array(32);
  domain.set(DOMAIN_SYNC_COMMITTEE, 0);
  domain.set(forkDataRoot.value.slice(0, 28), 4);
  return new Field(domain);
}
