import { ethers } from "ethers";
import finalityArtifact from "../artifacts/contracts/noir-verifiers/validate_finality/plonk_vk.sol/UltraVerifier.json" assert { type: "json" };
import nextSyncCommArtifact from "../artifacts/contracts/noir-verifiers/validate_next_sync_committee/plonk_vk.sol/UltraVerifier.json" assert { type: "json" };
import lcUpdateArtifact from "../artifacts/contracts/noir-verifiers/validate_lc_update/plonk_vk.sol/UltraVerifier.json" assert { type: "json" };
import lcValidatorArtifact from "../artifacts/contracts/LightClientValidator.sol/LightClientValidator.json" assert { type: "json" };
import { convertToHexAndPad } from "./converter/numeric.js";
import Field from "./primitives/field.js";
import { expect } from "chai";
import BeaconAPI from "./beacon-api/index.js";
import BeaconHeader from "./beacon/beacon-header.js";
import { readFileSync } from "fs";
import SyncCommittee from "./beacon/sync-committee.js";
import { SYNC_COMMITTEE_SIZE } from "./constants/index.js";
import LightClientUpdate from "./light-client/lc-update.js";

describe("test signature from beacon api", () => {
  let finalityVerifier: any;
  let nextSyncCommVerifier: any;
  let lcUpdateVerifier: any;
  let lcValidator: any;
  let nonce: number;
  let beaconAPI: BeaconAPI;
  let genesisValidatorsRoot: Field;
  let lcUpdates: any;
  let wallet: ethers.Wallet;
  let provider: ethers.AbstractProvider;
  const bootstrapFile = "bootstrap-state.json";

  before("deploy contracts", async () => {
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
  });

  before("download lc updates and genesis", async () => {
    beaconAPI = new BeaconAPI();

    const genesis = await beaconAPI.downloadGenesisData();
    genesisValidatorsRoot = Field.fromSSZ(
      genesis.data.data.genesis_validators_root
    );

    lcUpdates = await beaconAPI.downloadLCUpdates(700);
  });

  it("test decode bytes32", async () => {
    const randomField = Field.fromBigInt(
      BigInt("8438147109417471471947190471947190749182740709")
    );
    const [hi, lo] = randomField.hilo;
    const hiHex = convertToHexAndPad(hi);
    const loHex = convertToHexAndPad(lo);
    const actualField = await lcValidator.decodeBytes32(hiHex, loHex);
    expect(actualField).to.be.equal(randomField.ssz);
  });

  it("test decode Beacon", async () => {
    const update = lcUpdates.data[0];
    const beacon = new BeaconHeader(update.data.attested_header.beacon);
    const beaconData = beacon.flat.map((e) => convertToHexAndPad(e));
    const actualBeacon = await lcValidator.decodeBeacon(beaconData);
    expect(actualBeacon[0]).to.be.equal(beacon.slot.bigInt);
    expect(actualBeacon[1]).to.be.equal(beacon.proposerIndex.bigInt);
    expect(actualBeacon[2]).to.be.equal(beacon.parentRoot.ssz);
    expect(actualBeacon[3]).to.be.equal(beacon.stateRoot.ssz);
    expect(actualBeacon[4]).to.be.equal(beacon.bodyRoot.ssz);
  });

  it("test validate LC update", async () => {
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
    const lcUpdate = LightClientUpdate.fromObject(update.data);
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

    const result = await lcValidator.validateLCUpdate(lcValidateData);
    console.log(result);
  });
});
