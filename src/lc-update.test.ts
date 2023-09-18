import { BeaconHeaderObject } from "./index.js";
import SyncCommittee from "./beacon/sync-committee.js";
import BeaconAPI from "./beacon-api/index.js";
import { readFileSync, writeFileSync } from "fs";
import { expect } from "chai";
import { SYNC_COMMITTEE_SIZE } from "./constants/index.js";
import Field from "./primitives/field.js";
import LightClientUpdate from "./light-client/lc-update.js";
import { ethers } from "ethers";
import validateLCUpdateCircuit from "../circuits/main/validate_lc_update/target/validate_lc_update.json" assert { type: "json" };
import validateFinalityCircuit from "../circuits/main/validate_finality/target/validate_finality.json" assert { type: "json" };
import validateNextSyncCommCircuit from "../circuits/main/validate_next_sync_committee/target/validate_next_sync_committee.json" assert { type: "json" };
import { generateProof } from "./berretenberg-api/index.js";
import finalityArtifact from "../artifacts/contracts/noir-verifiers/validate_finality/plonk_vk.sol/UltraVerifier.json" assert { type: "json" };
import nextSyncCommArtifact from "../artifacts/contracts/noir-verifiers/validate_next_sync_committee/plonk_vk.sol/UltraVerifier.json" assert { type: "json" };
import lcUpdateArtifact from "../artifacts/contracts/noir-verifiers/validate_lc_update/plonk_vk.sol/UltraVerifier.json" assert { type: "json" };

describe("test signature from beacon api", () => {
  let beaconAPI: BeaconAPI;
  let genesisValidatorsRoot: Field;
  let lcUpdates: any;
  const bootstrapFile = "bootstrap-state.json";
  async function testWithContract(
    witness: Map<number, string>,
    circuitArtifact: any,
    smartContractArtifact: any
  ) {
    const proof = await generateProof(witness, circuitArtifact);
    const provider = ethers.getDefaultProvider("http://127.0.0.1:8545");
    const wallet = new ethers.Wallet(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      provider
    );
    const Verifier = new ethers.ContractFactory(
      smartContractArtifact.abi,
      smartContractArtifact.bytecode,
      wallet
    );
    const verifier = await Verifier.deploy();

    // @ts-ignore
    await verifier.verify(proof.slicedProof, proof.publicInputs);
  }
  async function testFinality(lcUpdate: LightClientUpdate) {
    const witness = lcUpdate.generateFinalityWitness();
    await testWithContract(witness, validateFinalityCircuit, finalityArtifact);
  }

  async function testSyncComm(lcUpdate: LightClientUpdate) {
    const witness = lcUpdate.generateNextSyncCommitteeWitness();
    await testWithContract(
      witness,
      validateNextSyncCommCircuit,
      nextSyncCommArtifact
    );
  }

  async function testLCUpdate(lcUpdate: LightClientUpdate) {
    const witness = lcUpdate.generateLCUpdateWitness(genesisValidatorsRoot);
    await testWithContract(witness, validateLCUpdateCircuit, lcUpdateArtifact);
  }

  before("download lc updates and genesis", async () => {
    beaconAPI = new BeaconAPI();

    const genesis = await beaconAPI.downloadGenesisData();
    genesisValidatorsRoot = Field.fromSSZ(
      genesis.data.data.genesis_validators_root
    );

    lcUpdates = await beaconAPI.downloadLCUpdates(700);
  });
  it.skip("download boostrap state", async () => {
    const update = lcUpdates.data[0];
    const beaconObj = update.data.attested_header.beacon as BeaconHeaderObject;
    const slot = beaconObj.slot;
    const state = await beaconAPI.downloadBeaconState(slot);
    writeFileSync(bootstrapFile, JSON.stringify(state.data));
  });
  it("test lc update 0", async () => {
    const bootstrapState = JSON.parse(readFileSync(bootstrapFile, "utf-8"));
    const currentSyncCommittee = new SyncCommittee(
      bootstrapState.data.current_sync_committee
    );
    const nextSyncCommittee = new SyncCommittee(
      bootstrapState.data.next_sync_committee
    );
    const update = lcUpdates.data[0];
    const expectedNextSyncCommittee = new SyncCommittee(
      update.data.next_sync_committee
    );
    for (let i = 0; i < SYNC_COMMITTEE_SIZE; i++)
      expect(nextSyncCommittee.pubKeys[i].ssz).to.be.equal(
        expectedNextSyncCommittee.pubKeys[i].ssz
      );
    const lcUpdate = LightClientUpdate.fromJSON(update.data);
    expect(lcUpdate.isFinalityUpdate()).to.be.false;
    expect(lcUpdate.isSyncCommitteeUpdate()).to.be.true;
    const isLCValid = lcUpdate.isValid(
      currentSyncCommittee,
      genesisValidatorsRoot
    );
    expect(isLCValid.valid).to.be.true;

    await testFinality(lcUpdate);
    await testSyncComm(lcUpdate);
    await testLCUpdate(lcUpdate);
  });
  it("test lc update 1", async () => {
    const previousUpdate = lcUpdates.data[0];
    const currentSyncCommittee = new SyncCommittee(
      previousUpdate.data.next_sync_committee
    );

    const update = lcUpdates.data[1];
    const lcUpdate = LightClientUpdate.fromJSON(update.data);
    expect(lcUpdate.isFinalityUpdate()).to.be.true;
    expect(lcUpdate.isSyncCommitteeUpdate()).to.be.true;
    const isLCValid = lcUpdate.isValid(
      currentSyncCommittee,
      genesisValidatorsRoot
    );
    expect(isLCValid.valid).to.be.true;

    await testFinality(lcUpdate);
    await testSyncComm(lcUpdate);
    await testLCUpdate(lcUpdate);
  });
});
