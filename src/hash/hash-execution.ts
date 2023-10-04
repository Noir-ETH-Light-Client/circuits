import Field from "../primitives/field.js";
import { ExecutionPayloadHeaderObject } from "../index.js";
import { ssz } from "@lodestar/types";

export default function executionHashTreeRoot(
  obj: ExecutionPayloadHeaderObject
): Field {
  const capellaHeader = ssz.capella.ExecutionPayloadHeader.fromJson(obj);
  const headerRoot =
    ssz.capella.ExecutionPayloadHeader.hashTreeRoot(capellaHeader);
  return new Field(headerRoot);
}
