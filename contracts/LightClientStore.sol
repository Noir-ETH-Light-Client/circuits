// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {ILightClientStore} from "./ILightClientStore.sol";
import {ILightClientValidator} from "./IClientValidator.sol";

contract LightClientStore is ILightClientStore {
    ILightClientValidator public lcValidator;

    uint8 public constant MAX_SYNC_PERIODS_CACHE = 2;
    uint8 public constant SAFETY_THRESHOLD = 2;
    uint16 public constant SLOTS_PER_PERIOD = 1 << 13;
    uint16 public constant SYNC_COMMITTEE_SIZE = 512;

    uint64 public latestSlot;
    uint8 public syncCommitteesIndex;
    uint8 public bestValidUpdatesIndex;
    uint8 public maxActiveParticipantsIndex;

    bool public allowForceUpdate;

    BeaconHeader public finalizeHeader;
    BeaconHeader public optimisticHeader;

    SyncCommittee[MAX_SYNC_PERIODS_CACHE] syncCommittees;
    LightClientUpdate[MAX_SYNC_PERIODS_CACHE] bestValidUpdates;
    ActiveParticipants[MAX_SYNC_PERIODS_CACHE] maxActiveParticipants;

    event OptimisticHeaderUpdated(BeaconHeader newHeader);
    event FinalityHeaderUpdated(BeaconHeader newHeader);

    constructor(ILightClientValidator _lcValidator) {
        lcValidator = _lcValidator;
    }

    function slotToPeriod(uint64 slot) public pure returns (uint64) {
        return slot / SLOTS_PER_PERIOD;
    }

    function getSafetyThreshold(
        uint16 activeParticipants
    ) public pure returns (uint16) {
        return activeParticipants / SAFETY_THRESHOLD;
    }

    function isSafeLCUpdate(
        LightClientUpdateSummary memory update
    ) public pure returns (bool) {
        return
            update.isFinalityUpdate &&
            update.isSyncCommitteeUpdate &&
            (3 * update.activeParticipants >= 2 * SYNC_COMMITTEE_SIZE);
    }

    function isBetterLCUpdate(
        LightClientUpdateSummary memory newUpdate,
        LightClientUpdateSummary memory oldUpdate
    ) public pure returns (bool) {
        // Compare supermajority (> 2/3) sync committee participation
        uint16 newNumActiveParticipants = newUpdate.activeParticipants;
        uint16 oldNumActiveParticipants = oldUpdate.activeParticipants;
        bool newHasSupermajority = newNumActiveParticipants * 3 >=
            SYNC_COMMITTEE_SIZE * 2;
        bool oldHasSupermajority = oldNumActiveParticipants * 3 >=
            SYNC_COMMITTEE_SIZE * 2;
        if (newHasSupermajority != oldHasSupermajority) {
            return newHasSupermajority;
        }
        if (
            !newHasSupermajority &&
            newNumActiveParticipants != oldNumActiveParticipants
        ) {
            return newNumActiveParticipants > oldNumActiveParticipants;
        }

        // Compare presence of relevant sync committee
        bool newHasRelevantSyncCommittee = newUpdate.isSyncCommitteeUpdate &&
            slotToPeriod(newUpdate.attestedHeaderSlot) ==
            slotToPeriod(newUpdate.signatureSlot);
        bool oldHasRelevantSyncCommittee = oldUpdate.isSyncCommitteeUpdate &&
            slotToPeriod(oldUpdate.attestedHeaderSlot) ==
            slotToPeriod(oldUpdate.signatureSlot);
        if (newHasRelevantSyncCommittee != oldHasRelevantSyncCommittee) {
            return newHasRelevantSyncCommittee;
        }

        // Compare indication of any finality
        bool newHasFinality = newUpdate.isFinalityUpdate;
        bool oldHasFinality = oldUpdate.isFinalityUpdate;
        if (newHasFinality != oldHasFinality) {
            return newHasFinality;
        }

        // Compare sync committee finality
        if (newHasFinality) {
            bool newHasSyncCommitteeFinality = slotToPeriod(
                newUpdate.finalizedHeaderSlot
            ) == slotToPeriod(newUpdate.attestedHeaderSlot);
            bool oldHasSyncCommitteeFinality = slotToPeriod(
                oldUpdate.finalizedHeaderSlot
            ) == slotToPeriod(oldUpdate.attestedHeaderSlot);
            if (newHasSyncCommitteeFinality != oldHasSyncCommitteeFinality) {
                return newHasSyncCommitteeFinality;
            }
        }

        // Tiebreaker 1: Sync committee participation beyond supermajority
        if (newNumActiveParticipants != oldNumActiveParticipants) {
            return newNumActiveParticipants > oldNumActiveParticipants;
        }

        // Tiebreaker 2: Prefer older data (fewer changes to best)
        if (newUpdate.attestedHeaderSlot != oldUpdate.attestedHeaderSlot) {
            return newUpdate.attestedHeaderSlot < oldUpdate.attestedHeaderSlot;
        }
        return newUpdate.signatureSlot < oldUpdate.signatureSlot;
    }

    function setFinalizedHeader(BeaconHeader memory newHeader) private {
        finalizeHeader = newHeader;
        emit FinalityHeaderUpdated(newHeader);
    }

    function setOptimisticHeader(BeaconHeader memory newHeader) private {
        optimisticHeader = newHeader;
        emit OptimisticHeaderUpdated(newHeader);
    }

    function findMaxActiveParticipants(
        uint64 period
    ) internal view returns (uint16) {
        for (uint8 i = 0; i < MAX_SYNC_PERIODS_CACHE; i++) {
            if (maxActiveParticipants[i].period == period) {
                return maxActiveParticipants[i].count;
            }
        }
        return 0;
    }

    function getMaxActiveParticipants(
        uint64 period
    ) public view returns (uint16) {
        uint16 currentMaxParticipants = findMaxActiveParticipants(period);
        uint16 previousMaxParticipants = findMaxActiveParticipants(period - 1);
        return
            currentMaxParticipants > previousMaxParticipants
                ? currentMaxParticipants
                : previousMaxParticipants;
    }

    function setMaxActiveParticipants(
        uint64 period,
        uint16 activeParticipants
    ) internal {
        uint16 currMaxActiveParticipants = findMaxActiveParticipants(period);
        if (activeParticipants > currMaxActiveParticipants) {
            maxActiveParticipants[
                maxActiveParticipantsIndex
            ] = ActiveParticipants(period, activeParticipants);

            maxActiveParticipantsIndex =
                (maxActiveParticipantsIndex + 1) %
                MAX_SYNC_PERIODS_CACHE;
        }
    }

    function getAndUpdateSyncCommittee(
        uint64 period
    ) internal returns (SyncCommittee memory) {
        for (uint8 i = 0; i < MAX_SYNC_PERIODS_CACHE; i++) {
            if (syncCommittees[i].period == period) {
                return syncCommittees[i];
            }
        }

        for (uint8 i = 0; i < MAX_SYNC_PERIODS_CACHE; i++) {
            if (
                slotToPeriod(bestValidUpdates[i].summary.signatureSlot) ==
                period - 1
            ) {
                if (
                    isSafeLCUpdate(bestValidUpdates[i].summary) ||
                    allowForceUpdate
                ) {
                    syncCommittees[syncCommitteesIndex] = SyncCommittee(
                        bestValidUpdates[i].nextPubkeys,
                        period
                    );
                    syncCommitteesIndex =
                        (syncCommitteesIndex + 1) %
                        MAX_SYNC_PERIODS_CACHE;
                }
            }
        }

        revert("No sync committee available for the given period");
    }

    function setBestValidUpdate(
        uint64 period,
        LightClientUpdate memory newUpdate
    ) internal {
        for (uint8 i = 0; i < MAX_SYNC_PERIODS_CACHE; i++) {
            if (
                slotToPeriod(bestValidUpdates[i].summary.signatureSlot) ==
                period
            ) {
                if (
                    !isBetterLCUpdate(
                        newUpdate.summary,
                        bestValidUpdates[i].summary
                    )
                ) {
                    return;
                }
            }
        }

        bestValidUpdates[bestValidUpdatesIndex] = newUpdate;
        bestValidUpdatesIndex =
            (bestValidUpdatesIndex + 1) %
            MAX_SYNC_PERIODS_CACHE;
    }

    function processLCUpdate(
        ILightClientValidator.LCValidateData memory lc
    ) external {
        (
            BeaconHeader memory attestedHeader,
            BeaconHeader memory updatedfinalizedHeader,
            LightClientUpdate memory update
        ) = lcValidator.validateLCUpdate(lc);
        require(
            update.summary.attestedHeaderSlot == attestedHeader.slot,
            "attested header slots mismatch"
        );
        require(
            update.summary.finalizedHeaderSlot == updatedfinalizedHeader.slot,
            "finalized header slots mismatch"
        );
        require(
            update.summary.signatureSlot <= latestSlot,
            "the signature slot mustn't pass the latest slot"
        );
        uint64 period = slotToPeriod(update.summary.signatureSlot);
        SyncCommittee memory syncCommittee = getAndUpdateSyncCommittee(period);
        // TO-DO: verify LC Update

        uint16 activeParticipants = update.summary.activeParticipants;
        setMaxActiveParticipants(period, activeParticipants);

        uint16 currMaxActiveParticipants = getMaxActiveParticipants(period);
        if (
            activeParticipants >
            getSafetyThreshold(currMaxActiveParticipants) &&
            attestedHeader.slot > optimisticHeader.slot
        ) {
            setOptimisticHeader(attestedHeader);
        }

        if (
            activeParticipants * 3 >= SYNC_COMMITTEE_SIZE * 2 &&
            updatedfinalizedHeader.slot > finalizeHeader.slot
        ) {
            setFinalizedHeader(updatedfinalizedHeader);
            if (finalizeHeader.slot > optimisticHeader.slot) {
                setOptimisticHeader(finalizeHeader);
            }
        }

        if (update.summary.isSyncCommitteeUpdate) {
            setBestValidUpdate(period, update);
        }
    }
}
