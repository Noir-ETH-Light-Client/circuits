import { BeaconHeaderObject } from "./index.js";
import SyncCommittee from "./types/beacon/sync-committee.js";
import BeaconAPI from "./beacon-api/index.js";
import { readFileSync, writeFileSync } from "fs";
import { expect } from "chai";
import { SYNC_COMMITTEE_SIZE } from "./constants/index.js";
import Field from "./types/primitives/field.js";
import LightClientUpdate from "./types/light-client/lc-update.js";

describe("test signature from beacon api", () => {
  let beaconAPI: BeaconAPI;
  let genesisValidatorsRoot: Field;
  let lcUpdates: any;
  const bootstrapFile = "bootstrap-state.json";
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
  });
});
