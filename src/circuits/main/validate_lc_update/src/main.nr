use dep::types::{LightClientHeader, BeaconHeader};
use dep::primitives::bytes32::Bytes32;
use dep::primitives::bytes48::Bytes48;
use dep::noirlib::validate_lc_update::validate_lc_update;

fn main(
    signature_slot: pub Field,
    attested_beacon: pub BeaconHeader,
    attested_execution_root: pub Bytes32,
    attested_execution_branch: [Bytes32; 4],
    finalized_beacon: pub BeaconHeader,
    finalized_execution_root: pub Bytes32,
    finalized_execution_branch: [Bytes32; 4],
    finality_branch: [Bytes32; 6],
    next_sync_committee_pubkeys_root: pub Bytes32,
    next_sync_committee_aggkey: pub Bytes48,
    next_sync_committee_branch: [Bytes32; 5],
    sync_committee_bits: pub [bool; 512],
    sync_committee_signed_aggkey: pub Bytes48,
    sync_committee_signature: pub [u8; 96],
    signing_root: pub Bytes32,
    is_finality_update: pub bool,
    is_sync_committee_update: pub bool,
    active_participants: pub u32
){
    let attested_header = LightClientHeader{
        beacon: attested_beacon,
        execution_root: attested_execution_root,
        execution_branch: attested_execution_branch
    };

    let finalized_header = LightClientHeader{
        beacon: finalized_beacon,
        execution_root: finalized_execution_root,
        execution_branch: finalized_execution_branch
    };

    validate_lc_update(
        signature_slot,
        attested_header,
        finalized_header,
        finality_branch,
        next_sync_committee_pubkeys_root,
        next_sync_committee_aggkey,
        next_sync_committee_branch,
        sync_committee_bits,
        sync_committee_signed_aggkey,
        sync_committee_signature,
        signing_root,
        is_finality_update,
        is_sync_committee_update,
        active_participants
    );

}