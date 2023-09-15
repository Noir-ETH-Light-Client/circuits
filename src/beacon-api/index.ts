import axios from "axios";

const DEFAULT_SERVER_URL = "http://testing.mainnet.beacon-api.nimbus.team/";
const LC_UPDATE_ROUTE = "eth/v1/beacon/light_client/updates";
const GENESIS_ROUTE = "eth/v1/beacon/genesis";
const BOOTSTRAP_ROUTE = "eth/v0/beacon/light_client/bootstrap";
const BLOCK_ROUTE = "eth/v2/beacon/blocks";
const STATES_ROUTE = "eth/v1/beacon/states";
const STATES_DEBUG_ROUTE = "eth/v2/debug/beacon/states";

export default class BeaconAPI {
  public serverURL: string;
  constructor(serverURL: string = DEFAULT_SERVER_URL) {
    this.serverURL = serverURL;
  }

  async downloadLCUpdates(startPeriod: number, count: number = 128) {
    return await axios.get(
      `${this.serverURL}${LC_UPDATE_ROUTE}?start_period=${startPeriod}&count=${count}`
    );
  }

  async downloadGenesisData() {
    return await axios.get(`${this.serverURL}${GENESIS_ROUTE}`);
  }

  async downloadBootstrap(blockRoot: string) {
    return await axios.get(`${this.serverURL}${BOOTSTRAP_ROUTE}/${blockRoot}`);
  }

  async downloadBlock(blockRoot: string) {
    return await axios.get(`${this.serverURL}${BLOCK_ROUTE}/${blockRoot}`);
  }

  async downloadStateSyncCommittees(slot: string) {
    return await axios.get(
      `${this.serverURL}${STATES_ROUTE}/${slot}/sync_committees`
    );
  }

  async downloadBeaconState(slot: string) {
    return await axios.get(`${this.serverURL}${STATES_DEBUG_ROUTE}/${slot}`);
  }
}
