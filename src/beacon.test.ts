import {} from "./converter/index.js";
import { expect } from "chai";
import {
  BeaconHeaderObject,
  ExecutionPayloadHeaderObject,
  SyncCommitteeObject,
} from "./index.js";
import BeaconHeader from "./types/beacon-header.js";
import Field from "./types/field.js";
import {
  EXECUTION_PAYLOAD_INDEX,
  FINALIZED_ROOT_INDEX,
  NEXT_SYNC_COMMITTEE_INDEX,
} from "./constants/index.js";
import hashMerkleBranch from "./hash/hash-merkle-brach.js";
import SyncCommittee from "./types/sync-committee.js";
import { downloadLCUpdates } from "./beacon-api/index.js";
import executionHashTreeRoot from "./hash/hash-execution.js";

describe("test beacon api", () => {
  let res: any;

  before("download lc updates", async () => {
    res = await downloadLCUpdates(700);
  });
  it("test hashing a beacon header", async () => {
    const update = res.data[0];
    const beaconObj = update.data.attested_header.beacon as BeaconHeaderObject;

    const beacon = new BeaconHeader(beaconObj);

    expect(beacon.hashTreeRoot.ssz).to.be.equal(
      "0x20924411d7e9945ad9ffde97ca1748f91b26bbdafb15d1779e8786c624345f97"
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
      "0x66539f25a936c2f589f6454ad01e4ef663c0d40fc54e4232adfbe69b885796f3"
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
  it("validate capella lc header", async () => {
    const update = res.data[0];
    expect(update.version).to.be.equal("capella");
    const attestedHeader = update.data.attested_header;

    const executionObj =
      attestedHeader.execution as ExecutionPayloadHeaderObject;

    const executionRoot = executionHashTreeRoot(executionObj);
    expect(executionRoot.ssz).to.be.equal(
      "0x0d22cf1eac3f229b478d13e8c7d3b6cdcc83299788419b29f27b663233ae67ed"
    );

    const executionBranch = attestedHeader.execution_branch.map((ssz: string) =>
      Field.fromSSZ(ssz)
    );

    const index = Field.fromBigInt(BigInt(EXECUTION_PAYLOAD_INDEX));

    const expectedBodyRoot = hashMerkleBranch(
      executionRoot,
      executionBranch,
      index
    );
    expect(attestedHeader.beacon.body_root).to.be.equal(expectedBodyRoot.ssz);
  });
});
