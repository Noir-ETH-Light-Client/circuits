import {} from "./converter/numeric.js";
import { expect } from "chai";
import {
  BeaconHeaderObject,
  ExecutionPayloadHeaderObject,
  SyncCommitteeObject,
} from "./index.js";
import BeaconHeader from "./types/beacon/beacon-header.js";
import Field from "./types/primitives/field.js";
import {
  EXECUTION_PAYLOAD_INDEX,
  FINALIZED_ROOT_INDEX,
  NEXT_SYNC_COMMITTEE_INDEX,
  SYNC_COMMITTEE_SIZE,
} from "./constants/index.js";
import hashMerkleBranch from "./hash/hash-merkle-brach.js";
import SyncCommittee from "./types/beacon/sync-committee.js";
import BeaconAPI from "./beacon-api/index.js";
import executionHashTreeRoot from "./hash/hash-execution.js";
import VariableLengthField from "./types/primitives/variable-length-field.js";

describe("test beacon api", () => {
  let res: any;
  let beaconAPI: BeaconAPI;
  before("download lc updates", async () => {
    beaconAPI = new BeaconAPI();
    res = await beaconAPI.downloadLCUpdates(700);
  });
  it("test validator root", async () => {
    const update = res.data[0];
    const beaconObj = update.data.attested_header.beacon as BeaconHeaderObject;
    const slot = beaconObj.slot;
    const state = await beaconAPI.downloadBeaconState(slot);
    console.log(state.data);
    const genesis = await beaconAPI.downloadGenesisData();
    console.log(genesis.data);
  });
  it("test hashing a beacon header", async () => {
    const update = res.data[0];
    const beaconObj = update.data.attested_header.beacon as BeaconHeaderObject;
    console.log(beaconObj);
    const beacon = new BeaconHeader(beaconObj);

    const beaconRoot = beacon.hashTreeRoot.ssz;

    const block = await beaconAPI.downloadBlock(beaconRoot);
    console.log(block.data.data);

    // const slot = beaconObj.slot;
    // const state = await beaconAPI.downloadBeaconState(slot);
    // console.log(state.data);
    // 0x855ff805f8aba3e166bdc56cf50830ce284437d7842666802fbc30864292d043137ff7b55ddcb0ad4ea5038cb4e36430
    // 0x4b363db94e286120d76eb905340fdd4e54bfe9f06bf33ff6cf5ad27f511bfe95
    // 0x4b363db94e286120d76eb905340fdd4e54bfe9f06bf33ff6cf5ad27f511bfe95
    console.log(update.data.next_sync_committee);
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
  it("validate sync committee signature", async () => {
    for (let i = 0; i < res.data.length; i++) {
      const nextUpdate = res.data[i];
      const syncCommBits = nextUpdate.data.sync_aggregate.sync_committee_bits;
      const bits = VariableLengthField.fromSSZ(
        syncCommBits,
        SYNC_COMMITTEE_SIZE
      ).leBits;
      const bitsSum = bits.reduce((sum, bit) => sum + (bit ? 1 : 0), 0);
      console.log(bitsSum + " per " + SYNC_COMMITTEE_SIZE);
      const parentRoot = nextUpdate.data.attested_header.beacon.parent_root;
      const slot = nextUpdate.data.attested_header.beacon.slot;
      console.log(slot);
      console.log(parentRoot);
    }
  });

  it("get bootstrap sync committee", async () => {});
});
