import axios from "axios";

export const DEFAULT_SERVER_URL =
  "http://unstable.prater.beacon-api.nimbus.team/";
export const LC_UPDATE_ROOT = "eth/v1/beacon/light_client/updates";

export async function downloadLCUpdates(
  startPeriod: number,
  count: number,
  serverURL = DEFAULT_SERVER_URL
) {
  return await axios.get(
    `${serverURL}${LC_UPDATE_ROOT}?start_period=${startPeriod}&count=${count}`
  );
}
