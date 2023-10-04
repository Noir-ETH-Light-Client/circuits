import { ethers } from "ethers";
import finalityArtifact from "../artifacts/contracts/noir-verifiers/validate_finality/plonk_vk.sol/UltraVerifier.json" assert { type: "json" };
import nextSyncCommArtifact from "../artifacts/contracts/noir-verifiers/validate_next_sync_committee/plonk_vk.sol/UltraVerifier.json" assert { type: "json" };
import lcUpdateArtifact from "../artifacts/contracts/noir-verifiers/validate_lc_update/plonk_vk.sol/UltraVerifier.json" assert { type: "json" };
import lcValidatorArtifact from "../artifacts/contracts/LightClientValidator.sol/LightClientValidator.json" assert { type: "json" };
import lcStorageArtifact from "../artifacts/contracts/LightClientStore.sol/LightClientStore.json" assert { type: "json" };
import BeaconAPI from "./beacon-api/index.js";
import { readFileSync } from "fs";
import SyncCommittee from "./beacon/sync-committee.js";
import { SYNC_COMMITTEES_DEPTH } from "./constants/index.js";
import LightClientStore from "./light-client/lc-store.js";
import LightClientHeader from "./light-client/lc-header.js";
import LightClientBootstrap from "./light-client/lc-bootstrap.js";
import { expect } from "chai";
import Field from "./primitives/field.js";
import LightClientUpdate from "./light-client/lc-update.js";
import BeaconHeader from "./beacon/beacon-header.js";
import { slotToPeriod } from "./converter/time.js";

describe("test signature from beacon api", () => {
  let finalityVerifier: any;
  let nextSyncCommVerifier: any;
  let lcUpdateVerifier: any;
  let lcValidator: any;
  let lcStorageContract: any;
  let lcStorage: LightClientStore;
  let nonce: number;
  let beaconAPI: BeaconAPI;
  let genesisValidatorsRoot: Field;
  let lcUpdates: any;
  let wallet: ethers.Wallet;
  let provider: ethers.AbstractProvider;
  const bootstrapFile = "bootstrap-state.json";
  const proofsFile = "proofs.json";
  let contractData: any[];

  function checkHeadersMatch(contractBeacon: any[], beacon: BeaconHeader) {
    expect(contractBeacon[0]).to.be.equal(beacon.slot.bigInt);
    expect(contractBeacon[1]).to.be.equal(beacon.proposerIndex.bigInt);
    expect(contractBeacon[2]).to.be.equal(beacon.parentRoot.ssz);
    expect(contractBeacon[3]).to.be.equal(beacon.stateRoot.ssz);
    expect(contractBeacon[4]).to.be.equal(beacon.bodyRoot.ssz);
  }
  function parseJSONObject(obj: any[]) {
    const finalityProof = new Uint8Array(Object.values(obj[0]));
    const finalityInputs = obj[1].map(
      (e: any) => new Uint8Array(Object.values(e))
    );
    const nextSyncCommProof = new Uint8Array(Object.values(obj[2]));
    const nextSyncCommInputs = obj[3].map(
      (e: any) => new Uint8Array(Object.values(e))
    );
    const lcUpdateProof = new Uint8Array(Object.values(obj[4]));
    const lcUpdateInputs = obj[5].map(
      (e: any) => new Uint8Array(Object.values(e))
    );
    const nextPubkeys = obj[6].map((e: any) =>
      e.map((f: any) => new Uint8Array(Object.values(f)))
    );
    return [
      finalityProof,
      finalityInputs,
      nextSyncCommProof,
      nextSyncCommInputs,
      lcUpdateProof,
      lcUpdateInputs,
      nextPubkeys,
    ];
  }
  before("download lc updates and genesis", async () => {
    beaconAPI = new BeaconAPI();
    const genesis = await beaconAPI.downloadGenesisData();
    genesisValidatorsRoot = Field.fromSSZ(
      genesis.data.data.genesis_validators_root
    );
    lcUpdates = await beaconAPI.downloadLCUpdates(700);
  });

  before("read proofs.json", async () => {
    const data = JSON.parse(readFileSync(proofsFile, "utf8"));
    contractData = data.map((e: any) => parseJSONObject(e));
  });

  it("deploy contracts and bootstrap the lcStorage", async () => {
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

    lcStorageContract = await LightClientStorage.deploy(
      lcValidator.target,
      boostrapHeader,
      boostrapSyncCommitteeRoot,
      {
        nonce: nonce++,
      }
    );

    const bootstrapLCHeader = new LightClientHeader(
      bootstrapState.data.latest_block_header
    );
    const currentSyncCommitteeBranch = new Array(SYNC_COMMITTEES_DEPTH);
    for (let i = 0; i < SYNC_COMMITTEES_DEPTH; i++)
      currentSyncCommitteeBranch[i] = "0x0";
    const bootstrap = new LightClientBootstrap(
      bootstrapLCHeader,
      bootstrapState.data.current_sync_committee,
      currentSyncCommitteeBranch
    );
    lcStorage = LightClientStore.bootstrap(bootstrap);

    const expectedFinalizedHeader = await lcStorageContract.finalizeHeader();
    checkHeadersMatch(
      expectedFinalizedHeader,
      lcStorage.finalizedHeader.beacon
    );

    const contractSyncCommittee =
      await lcStorageContract.queryCurrentSyncCommitee();

    const expectedSyncCommRoot =
      bootstrap.currentSyncCommittee.hashTreeRoot.ssz;
    expect(contractSyncCommittee[0]).to.be.equal(expectedSyncCommRoot);
    expect(Number(contractSyncCommittee[1])).to.be.equal(
      slotToPeriod(Number(lcStorage.finalizedHeader.beacon.slot.bigInt))
    );
  });

  it("process lc updates", async () => {
    for (let i = 0; i < contractData.length; i++) {
      const update = lcUpdates.data[i];
      const lcUpdate = LightClientUpdate.fromObject(update.data);

      lcStorage.processLCUpdate(lcUpdate, true, genesisValidatorsRoot);

      const tx = await lcStorageContract.processLCUpdate(contractData[i]);
      await tx.wait();
      const expectedFinalizedHeader = await lcStorageContract.finalizeHeader();
      checkHeadersMatch(
        expectedFinalizedHeader,
        lcStorage.finalizedHeader.beacon
      );
    }
  });
});
