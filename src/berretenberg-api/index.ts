import { decompressSync } from "fflate";
import {
  Crs,
  RawBuffer,
  newBarretenbergApiAsync,
} from "@aztec/bb.js/dest/node/index.js";
import { compressWitness, executeCircuit } from "@noir-lang/acvm_js";
import { NoirSolidityProof } from "../index.js";

export async function validateWitness(
  witness: Map<number, string>,
  circuitArtifact: any
) {
  let acirBuffer = Buffer.from(circuitArtifact.bytecode, "base64");
  let acirBufferUncompressed = decompressSync(acirBuffer);
  let api = await newBarretenbergApiAsync(4);
  const [_exact, circuitSize, _subgroup] = await api.acirGetCircuitSizes(
    acirBufferUncompressed
  );
  const subgroupSize = Math.pow(2, Math.ceil(Math.log2(circuitSize)));
  const crs = await Crs.new(subgroupSize + 1);
  await api.commonInitSlabAllocator(subgroupSize);
  await api.srsInitSrs(
    new RawBuffer(crs.getG1Data()),
    crs.numPoints,
    new RawBuffer(crs.getG2Data())
  );

  const witnessMap = await executeCircuit(acirBuffer, witness, () => {
    throw Error("unexpected oracle");
  });

  const witnessBuff = compressWitness(witnessMap);
  return witnessBuff !== undefined;
}
export async function generateProof(
  witness: Map<number, string>,
  circuitArtifact: any
): Promise<NoirSolidityProof> {
  let acirBuffer = Buffer.from(circuitArtifact.bytecode, "base64");
  let acirBufferUncompressed = decompressSync(acirBuffer);
  let api = await newBarretenbergApiAsync(4);
  const [_exact, circuitSize, _subgroup] = await api.acirGetCircuitSizes(
    acirBufferUncompressed
  );
  const subgroupSize = Math.pow(2, Math.ceil(Math.log2(circuitSize)));
  const crs = await Crs.new(subgroupSize + 1);
  await api.commonInitSlabAllocator(subgroupSize);
  await api.srsInitSrs(
    new RawBuffer(crs.getG1Data()),
    crs.numPoints,
    new RawBuffer(crs.getG2Data())
  );

  let acirComposer = await api.acirNewAcirComposer(subgroupSize);

  const witnessMap = await executeCircuit(acirBuffer, witness, () => {
    throw Error("unexpected oracle");
  });

  const witnessBuff = compressWitness(witnessMap);

  const proof = await api.acirCreateProof(
    acirComposer,
    acirBufferUncompressed,
    decompressSync(witnessBuff),
    false
  );

  let numberPublicInputs = 0;
  for (var field of circuitArtifact.abi.parameters) {
    if (field.visibility == "public") {
      if (field.type.kind == "array") numberPublicInputs += field.type.length;
      else if (field.type.kind == "struct") {
        if (field.type.name == "BeaconHeader") {
          numberPublicInputs += 8;
        } else {
          numberPublicInputs += field.type.fields.length;
        }
      } else numberPublicInputs++;
    }
  }

  return {
    slicedProof: proof.slice(32 * numberPublicInputs),
    publicInputs: getPublicInputs(proof, numberPublicInputs),
  };
}

function getPublicInputs(proof: any, len: number) {
  var res = [];
  for (var i = 0; i < len; i++) {
    res.push(proof.slice(i * 32, (i + 1) * 32));
  }
  return res;
}
