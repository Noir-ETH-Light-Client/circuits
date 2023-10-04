// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {ILightClientStore} from "./ILightClientStore.sol";

interface ILightClientValidator {
    struct LCValidateData {
        bytes finalityProof;
        bytes32[] finalityData;
        bytes nextSyncCommProof;
        bytes32[] nextSyncCommData;
        bytes lcUpdateProof;
        bytes32[] lcUpdateData;
        bytes32[2][512] nextPubkeys;
    }

    function validateLCUpdate(
        LCValidateData memory lc
    )
        external
        view
        returns (
            ILightClientStore.BeaconHeader memory,
            ILightClientStore.BeaconHeader memory,
            ILightClientStore.LightClientUpdate memory
        );
}
