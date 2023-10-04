// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;
import {ILightClientStore} from "./ILightClientStore.sol";
import {ILightClientValidator} from "./IClientValidator.sol";

interface INoirProofVerifier {
    function verify(
        bytes calldata,
        bytes32[] calldata
    ) external view returns (bool);
}

contract LightClientValidator is ILightClientValidator {
    INoirProofVerifier public finalityVerifier;
    INoirProofVerifier public nextSyncCommVerifier;
    INoirProofVerifier public lcUpdateVerifier;

    constructor(address _finality, address _nextSyncComm, address _lcUpdate) {
        finalityVerifier = INoirProofVerifier(_finality);
        nextSyncCommVerifier = INoirProofVerifier(_nextSyncComm);
        lcUpdateVerifier = INoirProofVerifier(_lcUpdate);
    }

    function hashTwo(bytes32 x, bytes32 y) public pure returns (bytes32) {
        return sha256(abi.encode(x, y));
    }

    function hashPubkeys(
        bytes32[2][512] memory pubkeys
    ) public pure returns (bytes32) {
        bytes32[512] memory pubkeyRoots;
        for (uint16 i = 0; i < 512; i++) {
            pubkeyRoots[i] = hashTwo(pubkeys[i][0], pubkeys[i][1]);
        }
        bytes32[511] memory nodes;
        for (uint16 i = 0; i < 256; i++) {
            nodes[i] = hashTwo(pubkeyRoots[2 * i], pubkeyRoots[2 * i + 1]);
        }
        uint16 k = 0;
        for (uint16 i = 256; i < 511; i++) {
            nodes[i] = hashTwo(nodes[2 * k], nodes[2 * k + 1]);
            k = k + 1;
        }
        return nodes[510];
    }

    function reverse(bytes32 input) internal pure returns (bytes32 v) {
        v = input;

        // swap bytes
        v =
            ((v &
                0xFF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00) >>
                8) |
            ((v &
                0x00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF) <<
                8);

        // swap 2-byte long pairs
        v =
            ((v &
                0xFFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000) >>
                16) |
            ((v &
                0x0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF) <<
                16);

        // swap 4-byte long pairs
        v =
            ((v &
                0xFFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000) >>
                32) |
            ((v &
                0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF) <<
                32);

        // swap 8-byte long pairs
        v =
            ((v &
                0xFFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF0000000000000000) >>
                64) |
            ((v &
                0x0000000000000000FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF) <<
                64);

        // swap 16-byte long pairs
        v = (v >> 128) | (v << 128);
    }

    function decodeBytes32(
        bytes32 hi,
        bytes32 lo
    ) public pure returns (bytes32) {
        return reverse((hi << 128) | lo);
    }

    function decodeBeacon(
        bytes32[8] memory data
    ) public pure returns (ILightClientStore.BeaconHeader memory) {
        bytes32 parentRoot = decodeBytes32(data[2], data[3]);
        bytes32 stateRoot = decodeBytes32(data[4], data[5]);
        bytes32 bodyRoot = decodeBytes32(data[6], data[7]);
        uint64 slot = uint64(uint256(data[0]));
        uint64 propoerIndex = uint64(uint256(data[1]));
        return
            ILightClientStore.BeaconHeader(
                slot,
                propoerIndex,
                parentRoot,
                stateRoot,
                bodyRoot
            );
    }

    function validatePublicInputs(
        bytes32[] memory finalityData,
        bytes32[] memory nextSyncCommData,
        bytes32[] memory lcUpdateData
    )
        public
        pure
        returns (
            ILightClientStore.BeaconHeader memory,
            ILightClientStore.BeaconHeader memory,
            ILightClientStore.LightClientUpdateSummary memory
        )
    {
        /**
        finalityData: 19
        0 -> 7: attested beacon
        8 -> 15: finalized beacon
        16, 17: finalized execution root
        18: is finality update
         */
        require(
            finalityData.length == 19,
            "expect the length of the finality public data to be 19"
        );

        /**
        nextSyncCommData: 13
        0 -> 7: attested beacon
        8, 9: pubkeys root
        10, 11: agg key
        12: is sync committee update
         */
        require(
            nextSyncCommData.length == 13,
            "expect the length of the next sync committee public data to be 13"
        );

        /**
        lc update: 1 + 8 + 2 + 4 + 2 + 1 = 18
        0: signature slot
        1 -> 8: attested beacon
        9, 10: attested execution root
        11, 12, 13, 14: sync committee bits
        15, 16: signing root
        17: active participants
         */
        require(
            lcUpdateData.length == 18,
            "expect the length of the lc update public data to be 19"
        );

        bytes32[8] memory attestedBeaconData;
        for (uint8 i = 0; i < 7; i++) {
            require(
                finalityData[i] == nextSyncCommData[i],
                "attested beacons of finality data and next sync committee data don't match"
            );
            require(
                finalityData[i] == lcUpdateData[i + 1],
                "attested beacons of finality data and lc update data don't match"
            );
            attestedBeaconData[i] = finalityData[i];
        }
        ILightClientStore.BeaconHeader memory attestedBeacon = decodeBeacon(
            attestedBeaconData
        );

        bytes32[8] memory finalizedBeaconData;
        for (uint8 i = 8; i < 16; i++) {
            finalizedBeaconData[i - 8] = finalityData[i];
        }

        ILightClientStore.BeaconHeader memory finalizedBeacon = decodeBeacon(
            finalizedBeaconData
        );

        ILightClientStore.LightClientUpdateSummary
            memory summary = ILightClientStore.LightClientUpdateSummary(
                uint16(uint256(lcUpdateData[17])),
                attestedBeacon.slot,
                uint64(uint256(lcUpdateData[0])),
                finalizedBeacon.slot,
                nextSyncCommData[12] != 0,
                finalityData[18] != 0
            );

        return (attestedBeacon, finalizedBeacon, summary);
    }

    function validateLCUpdate(
        LCValidateData memory lc
    )
        external
        view
        override
        returns (
            ILightClientStore.BeaconHeader memory,
            ILightClientStore.BeaconHeader memory,
            ILightClientStore.LightClientUpdate memory
        )
    {
        require(
            finalityVerifier.verify(lc.finalityProof, lc.finalityData),
            "invalid finality zk proof"
        );
        require(
            nextSyncCommVerifier.verify(
                lc.nextSyncCommProof,
                lc.nextSyncCommData
            ),
            "invalid next sync committee zk proof"
        );
        require(
            lcUpdateVerifier.verify(lc.lcUpdateProof, lc.lcUpdateData),
            "invalid lc update zk proof"
        );
        (
            ILightClientStore.BeaconHeader memory attestedBeacon,
            ILightClientStore.BeaconHeader memory finalizedBeacon,
            ILightClientStore.LightClientUpdateSummary memory summary
        ) = validatePublicInputs(
                lc.finalityData,
                lc.nextSyncCommData,
                lc.lcUpdateData
            );

        ILightClientStore.LightClientUpdate memory lcUpdate = ILightClientStore
            .LightClientUpdate(hashPubkeys(lc.nextPubkeys), summary);

        return (attestedBeacon, finalizedBeacon, lcUpdate);
    }
}
