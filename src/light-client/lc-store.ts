import SyncCommittee from "../beacon/sync-committee.js";
import LightClientBootstrap from "./lc-bootstrap.js";
import LightClientHeader from "./lc-header.js";
import LightClientUpdate from "./lc-update.js";
import { slotToPeriod } from "../converter/time.js";
import {
  MAX_SYNC_PERIODS_CACHE,
  SAFETY_THRESHOLD_FACTOR,
  SYNC_COMMITTEE_SIZE,
} from "../constants/index.js";
import Field from "../primitives/field.js";
import {
  LightClientStoreObject,
  LightClientUpdateObject,
  LightClientUpdateSummary,
  SyncCommitteeObject,
} from "../index.js";
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

  constructor(
    syncCommittees: Map<number, SyncCommittee>,
    bestValidUpdates: Map<number, LightClientUpdateWithSummary>,
    finalizedHeader: LightClientHeader,
    optimisticHeader: LightClientHeader,
    maxActiveParticipants: Map<number, number>
  ) {
    this.syncCommittees = syncCommittees;
    this.bestValidUpdates = bestValidUpdates;
    this._finalizedHeader = finalizedHeader;
    this._optimisticHeader = optimisticHeader;
    this.maxActiveParticipants = maxActiveParticipants;
  }
  static bootstrap(bootstrap: LightClientBootstrap) {
    const finalizedHeader = bootstrap.header;
    const optimisticHeader = bootstrap.header;
    const syncCommittees = new Map<number, SyncCommittee>();
    const slot = bootstrap.header.beacon.slot;
    syncCommittees.set(
      slotToPeriod(Number(slot.bigInt)),
      bootstrap.currentSyncCommittee
    );
    const bestValidUpdates = new Map<number, LightClientUpdateWithSummary>();
    const maxActiveParticipants = new Map<number, number>();
    return new LightClientStore(
      syncCommittees,
      bestValidUpdates,
      finalizedHeader,
      optimisticHeader,
      maxActiveParticipants
    );
  }

  static fromObject(object: LightClientStoreObject) {
    const syncCommittees = new Map<number, SyncCommittee>();
    object.sync_committees.forEach((value, key) =>
      syncCommittees.set(Number(key), new SyncCommittee(value))
    );
    const bestValidUpdates = new Map<number, LightClientUpdateWithSummary>();
    object.best_valid_updates.forEach((value, key) => {
      const update = LightClientUpdate.fromObject(value);
      const summary = update.summary;
      bestValidUpdates.set(Number(key), { update, summary });
    });
    const maxActiveParticipants = new Map<number, number>();
    object.max_active_participants.forEach((value, key) => {
      maxActiveParticipants.set(Number(key), value);
    });
    return new LightClientStore(
      syncCommittees,
      bestValidUpdates,
      new LightClientHeader(object.finalized_header),
      new LightClientHeader(object.optimistic_header),
      maxActiveParticipants
    );
  }
  get object(): LightClientStoreObject {
    const sync_committees = new Map<string, SyncCommitteeObject>();
    this.syncCommittees.forEach((value, key) =>
      sync_committees.set(key.toString(), value.object)
    );
    const best_valid_updates = new Map<string, LightClientUpdateObject>();
    this.bestValidUpdates.forEach((value, key) =>
      best_valid_updates.set(key.toString(), value.update.object)
    );
    const max_active_participants = new Map<string, number>();
    this.maxActiveParticipants.forEach((value, key) => {
      max_active_participants.set(key.toString(), value);
    });
    return {
      finalized_header: this._finalizedHeader.object,
      optimistic_header: this._optimisticHeader.object,
      max_active_participants,
      sync_committees,
      best_valid_updates,
    };
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
    lcUpdate: LightClientUpdate,
    isForceUpdate: boolean,
    genesisValidatorsRoot: Field
  ) {
    const signatureSlot = Number(lcUpdate.signatureSlot.bigInt);
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
