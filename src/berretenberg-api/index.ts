import { decompressSync } from "fflate";
import {
  Crs,
  RawBuffer,
  newBarretenbergApiAsync,
} from "@aztec/bb.js/dest/node/index.js";
import { compressWitness, executeCircuit } from "@noir-lang/acvm_js";

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
export async function generateProofAndVerify(
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

  await api.acirInitProvingKey(acirComposer, acirBufferUncompressed);
  const verified = await api.acirVerifyProof(acirComposer, proof, false);
  return verified;
}
