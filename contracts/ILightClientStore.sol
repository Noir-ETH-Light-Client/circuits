// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface ILightClientStore {
    struct BeaconHeader {
        uint64 slot;
        uint64 proposerIndex;
        bytes32 parentRoot;
        bytes32 stateRoot;
        bytes32 bodyRoot;
    }
    struct SyncCommittee{
        bytes32 syncCommitteeRoot;
        uint64 period;
    }
    struct ActiveParticipants{
        uint64 period;
        uint16 count;
    }
    struct LightClientUpdate{
        bytes32 nextSyncCommitteeRoot;
        LightClientUpdateSummary summary;
    }
    struct LightClientUpdateSummary{
        uint16 activeParticipants;
        uint64 attestedHeaderSlot;
        uint64 signatureSlot;
        uint64 finalizedHeaderSlot;
        bool isSyncCommitteeUpdate;
        bool isFinalityUpdate;
    }
}
