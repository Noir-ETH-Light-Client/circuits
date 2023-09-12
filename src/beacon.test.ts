import {} from "./converter/index.js";
import { expect } from "chai";
import { BeaconHeaderObject, SyncCommitteeObject } from "./index.js";
import BeaconHeader from "./types/beacon-header.js";
import Field from "./types/field.js";
import {
  FINALIZED_ROOT_INDEX,
  NEXT_SYNC_COMMITTEE_INDEX,
} from "./constants/index.js";
import hashMerkleBranch from "./hash/hash-merkle-brach.js";
import SyncCommittee from "./types/sync-committee.js";
import { downloadLCUpdates } from "./beacon-api/index.js";

describe("test beacon api", () => {
  let res: any;

  before("download lc updates", async () => {
    res = await downloadLCUpdates(80, 128);
  });
  it("test hashing a beacon header", async () => {
    const update = res.data[0];
    const beaconObj = update.data.attested_header.beacon as BeaconHeaderObject;

    const beacon = new BeaconHeader(beaconObj);

    expect(beacon.hashTreeRoot.ssz).to.be.equal(
      "0xa6e43e4a6a8b7a5deb2c957253e6bdc903303922b798168d45e6c183047f2197"
    );
  });
  it("validate the finality root of an LC update", async () => {
    const update = res.data[0];

    const attestedBeaconObj = update.data.attested_header
      .beacon as BeaconHeaderObject;
    const attestedBeacon = new BeaconHeader(attestedBeaconObj);

    const finalizedBeaconObj = update.data.finalized_header
      .beacon as BeaconHeaderObject;
    const finalizedBeacon = new BeaconHeader(finalizedBeaconObj);
    const finalizedRoot = finalizedBeacon.hashTreeRoot;

    const finalityBranch = update.data.finality_branch.map((ssz: string) =>
      Field.fromSSZ(ssz)
    );

    const index = Field.fromBigInt(BigInt(FINALIZED_ROOT_INDEX));
    const expectedStateRoot = hashMerkleBranch(
      finalizedRoot,
      finalityBranch,
      index
    );
    expect(attestedBeacon.stateRoot.ssz).to.be.equal(expectedStateRoot.ssz);
  });
  it("validate the next sync committee of an LC update", async () => {
    const update = res.data[0];

    const attestedBeaconObj = update.data.attested_header
      .beacon as BeaconHeaderObject;
    const attestedBeacon = new BeaconHeader(attestedBeaconObj);

    const nextSyncCommitteeObj = update.data
      .next_sync_committee as SyncCommitteeObject;
    const nextSyncCommittee = new SyncCommittee(nextSyncCommitteeObj);

    expect(nextSyncCommittee.aggregateKey.hashTreeRoot.ssz).to.be.equal(
      "0x63fa893ff0f8e1f011f5ba7e07f7540ebc828664c7cbe19a845b4465c07802a7"
    );
    const nextSyncCommitteeRoot = nextSyncCommittee.hashTreeRoot;

    const nextSyncCommitteeBranch = update.data.next_sync_committee_branch.map(
      (ssz: string) => Field.fromSSZ(ssz)
    );
    const index = Field.fromBigInt(BigInt(NEXT_SYNC_COMMITTEE_INDEX));
    const expectedStateRoot = hashMerkleBranch(
      nextSyncCommitteeRoot,
      nextSyncCommitteeBranch,
      index
    );
    expect(attestedBeacon.stateRoot.ssz).to.be.equal(expectedStateRoot.ssz);
  });
});
