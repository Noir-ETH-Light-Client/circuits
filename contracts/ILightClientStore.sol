// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

interface ILightClientStore {
    struct BeaconHeader {
        uint256 parentRoot;
        uint256 stateRoot;
        uint256 bodyRoot;
        uint64 slot;
        uint64 proposerIndex;
    }
    struct SyncCommittee{
        uint256[4][512] pubkeys;
        uint64 period;
    }
    struct ActiveParticipants{
        uint64 period;
        uint16 count;
    }
    struct LightClientUpdate{
        uint256[4][512] nextPubkeys;
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
