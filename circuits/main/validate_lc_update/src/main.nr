use dep::types::{LightClientHeader, BeaconHeader};
use dep::primitives::bytes32::Bytes32;
use dep::primitives::bytes64::Bytes64;
use dep::noirlib::validate_lc_update::validate_lc_update;

fn main(
    signature_slot: pub Field,
    attested_beacon: pub BeaconHeader,
    attested_execution_root: pub Bytes32,
    attested_execution_branch: [Bytes32; 4],
    sync_committee_bits: pub Bytes64,
    signing_root: pub Bytes32,
    active_participants: pub u32
){
    let attested_header = LightClientHeader{
        beacon: attested_beacon,
        execution_root: attested_execution_root,
        execution_branch: attested_execution_branch
    };

    validate_lc_update(
        signature_slot,
        attested_header,
        sync_committee_bits,
        signing_root,
        active_participants
    );

}