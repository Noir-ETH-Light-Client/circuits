import { BeaconHeaderObject } from "./index.js";
import SyncCommittee from "./types/beacon/sync-committee.js";
import BeaconAPI from "./beacon-api/index.js";
import { readFileSync, writeFileSync } from "fs";
import { expect } from "chai";
import {
  CAPELLA_FORK_VERSION,
  SYNC_COMMITTEE_SIZE,
} from "./constants/index.js";
import Field from "./types/primitives/field.js";
import computeDomain from "./domain/compute-domain.js";
import hashTwo from "./hash/hash-two.js";
import BeaconHeader from "./types/beacon/beacon-header.js";
import { slotToForkVersion } from "./converter/time.js";
import VariableLengthField from "./types/primitives/variable-length-field.js";
import BLSSignature from "./types/beacon/bls-signature.js";

describe("test signature from beacon api", () => {
  let beaconAPI: BeaconAPI;
  let lcUpdates: any;
  const bootstrapFile = "bootstrap-state.json";
  before("download lc updates", async () => {
    beaconAPI = new BeaconAPI();
    lcUpdates = await beaconAPI.downloadLCUpdates(700);
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
  });
});
