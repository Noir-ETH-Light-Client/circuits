import { BeaconHeaderObject } from "./index.js";
import SyncCommittee from "./beacon/sync-committee.js";
import BeaconAPI from "./beacon-api/index.js";
import { readFileSync, writeFileSync } from "fs";
import { expect } from "chai";
import {
  CAPELLA_FORK_VERSION,
  SYNC_COMMITTEE_SIZE,
} from "./constants/index.js";
import Field from "./primitives/field.js";
import computeDomain from "./domain/compute-domain.js";
import hashTwo from "./hash/hash-two.js";
import BeaconHeader from "./beacon/beacon-header.js";
import { slotToForkVersion } from "./converter/time.js";
import VariableLengthField from "./primitives/variable-length-field.js";
import BLSSignature from "./beacon/bls-signature.js";
import artifact from "../artifacts/contracts/LightClientValidator.sol/LightClientValidator.json" assert { type: "json" };
import { ethers } from "ethers";

describe("test signature from beacon api", () => {
  let beaconAPI: BeaconAPI;
  let lcUpdates: any;
  const bootstrapFile = "bootstrap-state.json";
  let contract: any;

  before("download lc updates + deploy contract", async () => {
    beaconAPI = new BeaconAPI();
    lcUpdates = await beaconAPI.downloadLCUpdates(700);
    const provider = ethers.getDefaultProvider("http://127.0.0.1:8545");
    const wallet = new ethers.Wallet(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      provider
    );
    const Factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      wallet
    );
    contract = await Factory.deploy();
  });
  it.skip("download boostrap state", async () => {
    const update = lcUpdates.data[0];
    const beaconObj = update.data.attested_header.beacon as BeaconHeaderObject;
    const slot = beaconObj.slot;
    const state = await beaconAPI.downloadBeaconState(slot);
    writeFileSync(bootstrapFile, JSON.stringify(state.data));
  });
  it("test signature", async () => {
    const bootstrapState = JSON.parse(readFileSync(bootstrapFile, "utf-8"));

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

    const genesisValidatorsRoot = Field.fromSSZ(
      bootstrapState.data.genesis_validators_root
    );

    const attestedBeacon = new BeaconHeader(update.data.attested_header.beacon);
    const signatureSlot = Number(update.data.signature_slot);
    const forkVersion = slotToForkVersion(signatureSlot - 1);
    expect(forkVersion).to.be.equal(CAPELLA_FORK_VERSION);

    const domain = computeDomain(signatureSlot - 1, genesisValidatorsRoot);
    const signingRoot = hashTwo(attestedBeacon.hashTreeRoot, domain);

    const syncCommitteeBits = VariableLengthField.fromSSZ(
      update.data.sync_aggregate.sync_committee_bits,
      SYNC_COMMITTEE_SIZE / 8
    );
    const syncCommitteeSignature = BLSSignature.fromSSZ(
      update.data.sync_aggregate.sync_committee_signature
    ).chainsafeSignature;
    expect(syncCommitteeSignature.toHex()).to.be.equal(
      update.data.sync_aggregate.sync_committee_signature
    );

    const currentSyncCommittee = new SyncCommittee(
      bootstrapState.data.current_sync_committee
    );

    const aggregateKey =
      currentSyncCommittee.getAggregateParticipantPubkeys(syncCommitteeBits);

    expect(syncCommitteeSignature.verify(aggregateKey, signingRoot.value)).to.be
      .true;

    const pubkey0 = currentSyncCommittee.pubKeys[0];
    const pubkey0Root = pubkey0.hashTreeRoot;

    const pubkey0Data = pubkey0.contractData;
    const expectedPubkey0Root = await contract.hashTwo(...pubkey0Data);

    expect(expectedPubkey0Root).to.be.equal(pubkey0Root.ssz);

    const contractData = currentSyncCommittee.pubKeys.map(
      (pubkey) => pubkey.contractData
    );
    const expectedHash = currentSyncCommittee.pubkeysRoot.ssz;
    const actualHash = await contract.hashPubkeys(contractData);

    expect(actualHash).to.be.equal(expectedHash);
  });
});
