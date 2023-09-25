import { ethers } from "ethers";
import finalityArtifact from "../artifacts/contracts/noir-verifiers/validate_finality/plonk_vk.sol/UltraVerifier.json" assert { type: "json" };
import nextSyncCommArtifact from "../artifacts/contracts/noir-verifiers/validate_next_sync_committee/plonk_vk.sol/UltraVerifier.json" assert { type: "json" };
import lcUpdateArtifact from "../artifacts/contracts/noir-verifiers/validate_lc_update/plonk_vk.sol/UltraVerifier.json" assert { type: "json" };
import lcValidatorArtifact from "../artifacts/contracts/LightClientValidator.sol/LightClientValidator.json" assert { type: "json" };
import lcStorageArtifact from "../artifacts/contracts/LightClientStore.sol/LightClientStore.json" assert { type: "json" };
import Field from "./primitives/field.js";
import { expect } from "chai";
import BeaconAPI from "./beacon-api/index.js";
import { readFileSync } from "fs";
import SyncCommittee from "./beacon/sync-committee.js";
import { SYNC_COMMITTEE_SIZE } from "./constants/index.js";
import LightClientUpdate from "./light-client/lc-update.js";

describe("test signature from beacon api", () => {
  let finalityVerifier: any;
  let nextSyncCommVerifier: any;
  let lcUpdateVerifier: any;
  let lcValidator: any;
  let lcStorage: any;
  let nonce: number;
  let beaconAPI: BeaconAPI;
  let genesisValidatorsRoot: Field;
  let lcUpdates: any;
  let wallet: ethers.Wallet;
  let provider: ethers.AbstractProvider;
  const bootstrapFile = "bootstrap-state.json";

  before("download lc updates and genesis", async () => {
    beaconAPI = new BeaconAPI();

    const genesis = await beaconAPI.downloadGenesisData();
    genesisValidatorsRoot = Field.fromSSZ(
      genesis.data.data.genesis_validators_root
    );

    lcUpdates = await beaconAPI.downloadLCUpdates(700);
  });

  before("deploy contracts", async () => {
    const bootstrapState = JSON.parse(readFileSync(bootstrapFile, "utf-8"));
    const currentSyncCommittee = new SyncCommittee(
      bootstrapState.data.current_sync_committee
    );
    const boostrapSyncCommitteeRoot = currentSyncCommittee.hashTreeRoot.ssz;
    const boostrapHeader = Object.values(
      bootstrapState.data.latest_block_header
    );

    provider = ethers.getDefaultProvider("http://127.0.0.1:8545");
    wallet = new ethers.Wallet(
      "0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1",
      provider
    );

    nonce = await wallet.getNonce();

    const FinalityVerifier = new ethers.ContractFactory(
      finalityArtifact.abi,
      finalityArtifact.bytecode,
      wallet
    );
    finalityVerifier = await FinalityVerifier.deploy({ nonce: nonce++ });

    const NextSyncCommVerifier = new ethers.ContractFactory(
      nextSyncCommArtifact.abi,
      nextSyncCommArtifact.bytecode,
      wallet
    );
    nextSyncCommVerifier = await NextSyncCommVerifier.deploy({
      nonce: nonce++,
    });

    const LCUpdateVerifier = new ethers.ContractFactory(
      lcUpdateArtifact.abi,
      lcUpdateArtifact.bytecode,
      wallet
    );
    lcUpdateVerifier = await LCUpdateVerifier.deploy({ nonce: nonce++ });

    const LightClientValidator = new ethers.ContractFactory(
      lcValidatorArtifact.abi,
      lcValidatorArtifact.bytecode,
      wallet
    );

    lcValidator = await LightClientValidator.deploy(
      finalityVerifier.target,
      nextSyncCommVerifier.target,
      lcUpdateVerifier.target,
      { nonce: nonce++ }
    );

    const LightClientStorage = new ethers.ContractFactory(
      lcStorageArtifact.abi,
      lcStorageArtifact.bytecode,
      wallet
    );

    lcStorage = await LightClientStorage.deploy(
      lcValidator.target,
      boostrapHeader,
      boostrapSyncCommitteeRoot,
      {
        nonce: nonce++,
      }
    );
  });

  it("execute the 1st LC update", async () => {
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

    const lcValidateData = await lcUpdate.validateLCUpdateContractData(
      genesisValidatorsRoot
    );

    const tx = await lcStorage.processLCUpdate(lcValidateData);
    await tx.wait();

    const currentSync = await lcStorage.queryCurrentSyncCommitee();
    const currentBestValidUpdate =
      await lcStorage.queryCurrentBestValidUpdate();
    const currentMaxActiveParticipants =
      await lcStorage.queryCurrentMaxActiveParticipants();

    console.log(currentSync);
    console.log(currentBestValidUpdate);
    console.log(currentMaxActiveParticipants);
  });
});
