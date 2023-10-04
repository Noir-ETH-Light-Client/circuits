import BeaconAPI from "./beacon-api/index.js";
import { readFileSync, writeFileSync } from "fs";
import { SYNC_COMMITTEES_DEPTH } from "./constants/index.js";
import Field from "./primitives/field.js";
import LightClientUpdate from "./light-client/lc-update.js";
import LightClientBootstrap from "./light-client/lc-bootstrap.js";
import LightClientHeader from "./light-client/lc-header.js";
import LightClientStore from "./light-client/lc-store.js";
import { slotToPeriod } from "./converter/time.js";

describe("test signature from beacon api", () => {
  let beaconAPI: BeaconAPI;
  let genesisValidatorsRoot: Field;
  let lcUpdates: any;
  let lcStorage: LightClientStore;
  let validLCUpdates: LightClientUpdate[] = [];
  const bootstrapFile = "bootstrap-state.json";
  const lcDataFile = "proofs.json";

  before("download lc updates and genesis", async () => {
    beaconAPI = new BeaconAPI();

    const genesis = await beaconAPI.downloadGenesisData();
    genesisValidatorsRoot = Field.fromSSZ(
      genesis.data.data.genesis_validators_root
    );

    lcUpdates = await beaconAPI.downloadLCUpdates(700);
  });
  it("boostrap the storage", async () => {
    const bootstrapState = JSON.parse(readFileSync(bootstrapFile, "utf-8"));
    const bootstrapHeader = new LightClientHeader(
      bootstrapState.data.latest_block_header
    );
    const currentSyncCommitteeBranch = new Array(SYNC_COMMITTEES_DEPTH);
    for (let i = 0; i < SYNC_COMMITTEES_DEPTH; i++)
      currentSyncCommitteeBranch[i] = "0x0";
    const bootstrap = new LightClientBootstrap(
      bootstrapHeader,
      bootstrapState.data.current_sync_committee,
      currentSyncCommitteeBranch
    );
    console.log(
      "Bootstrap period: " +
        slotToPeriod(Number(bootstrapState.data.latest_block_header.slot))
    );
    lcStorage = new LightClientStore(bootstrap);
  });

  it("process lc updates", async () => {
    const maxLength = Math.min(2, lcUpdates.data.length);
    for (let i = 0; i < maxLength; i++) {
      const update = lcUpdates.data[i];
      const lcUpdate = LightClientUpdate.fromJSON(update.data);
      console.log(
        "LC Update period: " +
          slotToPeriod(Number(lcUpdate.signatureSlot.bigInt))
      );
      try {
        lcStorage.processLCUpdate(lcUpdate, true, genesisValidatorsRoot);
        console.log("lcStorage is updated successfully");
        console.log(lcStorage.finalizedHeader.beacon);
        validLCUpdates.push(lcUpdate);
      } catch (err) {
        console.error("Error: " + (err as Error).message);
      }
    }
  });

  it("record LCUpdate data", async () => {
    let proofs = [];
    for (let i = 0; i < validLCUpdates.length; i++) {
      console.log(`\n\nProof ${i}\n\n`);
      const data = await validLCUpdates[i].validateLCUpdateContractData(
        genesisValidatorsRoot
      );
      proofs.push(data);
    }
    writeFileSync(lcDataFile, JSON.stringify(proofs));
  });
});
