import {} from "./converter/numeric.js";
import { expect } from "chai";
import {
  BeaconHeaderObject,
  ExecutionPayloadHeaderObject,
  SyncCommitteeObject,
} from "./index.js";
import BeaconHeader from "./beacon/beacon-header.js";
import Field from "./primitives/field.js";
import {
  EXECUTION_PAYLOAD_INDEX,
  FINALIZED_ROOT_INDEX,
  NEXT_SYNC_COMMITTEE_INDEX,
} from "./constants/index.js";
import hashMerkleBranch from "./hash/hash-merkle-brach.js";
import SyncCommittee from "./beacon/sync-committee.js";
import BeaconAPI from "./beacon-api/index.js";
import executionHashTreeRoot from "./hash/hash-execution.js";

describe("test beacon api", () => {
  let res: any;
  let beaconAPI: BeaconAPI;
  before("download lc updates", async () => {
    beaconAPI = new BeaconAPI();
    res = await beaconAPI.downloadLCUpdates(700);
  });
  it("validate the finality root of an LC update", async () => {
    const update = res.data[1];

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
