import {
  ALTAIR_FORK_EPOCH,
  ALTAIR_FORK_VERSION,
  BELLATRIX_FORK_EPOCH,
  BELLATRIX_FORK_VERSION,
  CAPELLA_FORK_EPOCH,
  CAPELLA_FORK_VERSION,
  EPOCH_PER_PERIOD,
  GENESIS_FORK_VERSION,
  SLOTS_PER_EPOCH,
} from "../constants/index.js";

export function slotToEpoch(slot: number) {
  return Math.floor(slot / SLOTS_PER_EPOCH);
}

export function epochToPeriod(epoch: number) {
  return Math.floor(epoch / EPOCH_PER_PERIOD);
}

export function slotToPeriod(slot: number) {
  return epochToPeriod(slotToEpoch(slot));
}

export function epochToForkVersion(epoch: number) {
  if (epoch < ALTAIR_FORK_EPOCH) return GENESIS_FORK_VERSION;
  if (epoch < BELLATRIX_FORK_EPOCH) return ALTAIR_FORK_VERSION;
  if (epoch < CAPELLA_FORK_EPOCH) return BELLATRIX_FORK_VERSION;
  return CAPELLA_FORK_VERSION;
}

export function slotToForkVersion(slot: number) {
  return epochToForkVersion(slotToEpoch(slot));
}
