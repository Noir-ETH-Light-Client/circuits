import { slotToPeriod } from "src/converter/time";
import { SYNC_COMMITTEE_SIZE } from "../constants/index.js";
import { LightClientUpdateSummary } from "../index.js";

export function isBetterUpdate(
  newUpdate: LightClientUpdateSummary,
  oldUpdate: LightClientUpdateSummary
) {
  const newNumActiveParticipants = newUpdate.activeParticipants;
  const oldNumActiveParticipants = oldUpdate.activeParticipants;

  const isNewSupermajority =
    newNumActiveParticipants * 3 >= SYNC_COMMITTEE_SIZE * 2;
  const isOldSupermajority =
    newNumActiveParticipants * 3 >= SYNC_COMMITTEE_SIZE * 2;

  if (isNewSupermajority !== isOldSupermajority) {
    return isNewSupermajority;
  }

  if (
    !isNewSupermajority &&
    newNumActiveParticipants !== oldNumActiveParticipants
  ) {
    return newNumActiveParticipants > oldNumActiveParticipants;
  }

  const isNewRelevantSyncCommittee =
    newUpdate.isSyncCommitteeUpdate &&
    slotToPeriod(newUpdate.attestedHeaderSlot) ===
      slotToPeriod(newUpdate.signatureSlot);

  const isOldRelevantSyncCommittee =
    oldUpdate.isSyncCommitteeUpdate &&
    slotToPeriod(oldUpdate.attestedHeaderSlot) ===
      slotToPeriod(oldUpdate.signatureSlot);

  if (isNewRelevantSyncCommittee !== isOldRelevantSyncCommittee)
    return isNewRelevantSyncCommittee;

  const isNewFinality = newUpdate.isFinalityUpdate;
  const isOldFinality = oldUpdate.isFinalityUpdate;
  if (isNewFinality !== isOldFinality) {
    return isNewFinality;
  }

  if (isNewFinality) {
    const newHasSyncCommFinality =
      slotToPeriod(newUpdate.finalizedHeaderSlot) ===
      slotToPeriod(newUpdate.attestedHeaderSlot);
    const oldHasSyncCommFinality =
      slotToPeriod(oldUpdate.finalizedHeaderSlot) ===
      slotToPeriod(oldUpdate.attestedHeaderSlot);
    if (newHasSyncCommFinality !== oldHasSyncCommFinality) {
      return newHasSyncCommFinality;
    }
  }

  if (newNumActiveParticipants !== oldNumActiveParticipants) {
    return newNumActiveParticipants > oldNumActiveParticipants;
  }

  if (newUpdate.attestedHeaderSlot !== oldUpdate.attestedHeaderSlot) {
    return newUpdate.attestedHeaderSlot < oldUpdate.attestedHeaderSlot;
  }

  return newUpdate.signatureSlot < oldUpdate.signatureSlot;
}

export function isLightClientUpdateSafe(summary: LightClientUpdateSummary) {
  return (
    summary.activeParticipants * 3 >= SYNC_COMMITTEE_SIZE * 2 &&
    summary.isFinalityUpdate &&
    summary.isSyncCommitteeUpdate
  );
}
