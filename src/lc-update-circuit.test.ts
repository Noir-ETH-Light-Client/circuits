import BeaconAPI from "./beacon-api/index.js";
import Field from "./primitives/field.js";
import LightClientUpdate from "./light-client/lc-update.js";

describe("test signature from beacon api", () => {
    let beaconAPI: BeaconAPI;
    let genesisValidatorsRoot: Field;
    let lcUpdates: any;

    before("download lc updates and genesis", async () => {
        beaconAPI = new BeaconAPI();

        const genesis = await beaconAPI.downloadGenesisData();
        genesisValidatorsRoot = Field.fromSSZ(
            genesis.data.data.genesis_validators_root
        );

        lcUpdates = await beaconAPI.downloadLCUpdates(700);
    });


    it("test lc updates", async () => {
        for (let i = 0; i < lcUpdates.data.length; i++) {
            const update = lcUpdates.data[i];
            const lcUpdate = LightClientUpdate.fromObject(update.data);
            const data = await lcUpdate.validateLCUpdateContractData(genesisValidatorsRoot);
            console.log(data)
        }
    });

});
