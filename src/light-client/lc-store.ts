import SyncCommittee from "../beacon/sync-committee.js";
import LightClientBootstrap from "./lc-bootstrap.js";
import LightClientHeader from "./lc-header.js";
import LightClientUpdate from "./lc-update.js";
import { slotToEpoch, slotToPeriod } from "../converter/time.js";
import {
  MAX_SYNC_PERIODS_CACHE,
  SAFETY_THRESHOLD_FACTOR,
  SYNC_COMMITTEE_SIZE,
} from "../constants/index.js";
import Field from "../primitives/field.js";
import { LightClientUpdateSummary } from "../index.js";
import {
  isBetterUpdate,
  isLightClientUpdateSafe,
} from "./is-better-lc-update.js";

function pruneSetToMax<V>(set: Map<number, V>, max: number) {
  // Prune old entries
  for (const key of set.keys()) {
    if (key < max - MAX_SYNC_PERIODS_CACHE) {
      set.delete(key);
    }
  }
}

interface LightClientUpdateWithSummary {
  update: LightClientUpdate;
  summary: LightClientUpdateSummary;
}
export default class LightClientStore {
  readonly syncCommittees: Map<number, SyncCommittee>;
  readonly bestValidUpdates: Map<number, LightClientUpdateWithSummary>;
  private _finalizedHeader: LightClientHeader;
  private _optimisticHeader: LightClientHeader;
  readonly maxActiveParticipants: Map<number, number>;

  constructor(bootstrap: LightClientBootstrap) {
    this._finalizedHeader = bootstrap.header;
    this._optimisticHeader = bootstrap.header;
    this.syncCommittees = new Map<number, SyncCommittee>();
    const slot = bootstrap.header.beacon.slot;
    this.syncCommittees.set(
      slotToEpoch(Number(slot.bigInt)),
      bootstrap.currentSyncCommittee
    );
    this.bestValidUpdates = new Map<number, LightClientUpdateWithSummary>();
    this.maxActiveParticipants = new Map<number, number>();
  }

  get finalizedHeader() {
    return this._finalizedHeader;
  }

  get optimisticHeader() {
    return this._optimisticHeader;
  }

  getMaxActiveParticipants(period: number): number {
    const currMaxParticipants = this.maxActiveParticipants.get(period) ?? 0;
    const prevMaxParticipants = this.maxActiveParticipants.get(period - 1) ?? 0;

    return Math.max(currMaxParticipants, prevMaxParticipants);
  }

  setActiveParticipants(period: number, activeParticipants: number): void {
    const maxActiveParticipants = this.maxActiveParticipants.get(period) ?? 0;
    if (activeParticipants > maxActiveParticipants) {
      this.maxActiveParticipants.set(period, activeParticipants);
    }

    pruneSetToMax(this.maxActiveParticipants, period);
  }

  getCommitteeAtPeriod(period: number, isForceUpdate: boolean) {
    let syncCommittee = this.syncCommittees.get(period);
    if (syncCommittee) return syncCommittee;

    const bestValidUpdate = this.bestValidUpdates.get(period - 1);
    if (bestValidUpdate) {
      if (isLightClientUpdateSafe(bestValidUpdate.summary) || isForceUpdate) {
        syncCommittee = bestValidUpdate.update.nextSyncCommittee;
        this.syncCommittees.set(period, syncCommittee);
        this.bestValidUpdates.delete(period - 1);
        return syncCommittee;
      }
    }
    throw new Error(`no sync committee for period ${period}`);
  }

  processLCUpdate(
    currentSlot: number,
    lcUpdate: LightClientUpdate,
    isForceUpdate: boolean,
    genesisValidatorsRoot: Field
  ) {
    const signatureSlot = Number(lcUpdate.signatureSlot.bigInt);
    if (currentSlot < signatureSlot) {
      throw new Error("signature slot must be in the future");
    }
    const updatePeriod = slotToPeriod(signatureSlot);
    const syncCommittee = this.getCommitteeAtPeriod(
      updatePeriod,
      isForceUpdate
    );
    const isLCValid = lcUpdate.isValid(syncCommittee, genesisValidatorsRoot);
    if (!isLCValid.valid) {
      throw new Error(isLCValid.msg);
    }
    const numParticipants = lcUpdate.syncCommitteeBits.sumBits;
    this.setActiveParticipants(updatePeriod, numParticipants);

    const currentMaxParticipants = this.getMaxActiveParticipants(updatePeriod);

    if (
      numParticipants >
        Math.floor(currentMaxParticipants / SAFETY_THRESHOLD_FACTOR) &&
      lcUpdate.attestedHeader.beacon.slot.bigInt >
        this._optimisticHeader.beacon.slot.bigInt
    ) {
      this._optimisticHeader = lcUpdate.attestedHeader;
    }

    if (
      numParticipants * 3 >= SYNC_COMMITTEE_SIZE * 2 &&
      lcUpdate.finalizedHeader.beacon.slot.bigInt >
        this._finalizedHeader.beacon.slot.bigInt
    ) {
      this._finalizedHeader = lcUpdate.finalizedHeader;
      if (
        this._finalizedHeader.beacon.slot.bigInt >
        this._optimisticHeader.beacon.slot.bigInt
      ) {
        this._optimisticHeader = this._finalizedHeader;
      }
    }

    if (lcUpdate.isSyncCommitteeUpdate()) {
      const bestValidUpdate = this.bestValidUpdates.get(updatePeriod);
      const updateSummary = lcUpdate.summary;
      if (
        !bestValidUpdate ||
        isBetterUpdate(updateSummary, bestValidUpdate.summary)
      ) {
        this.bestValidUpdates.set(updatePeriod, {
          update: lcUpdate,
          summary: updateSummary,
        });
        pruneSetToMax(this.bestValidUpdates, updatePeriod);
      }
    }
  }
}
