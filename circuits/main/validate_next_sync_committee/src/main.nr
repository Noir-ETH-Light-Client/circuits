use dep::types::BeaconHeader;
use dep::primitives::bytes32::Bytes32;
use dep::primitives::bytes48::Bytes48;
use dep::noirlib::validate_next_sync_committee::validate_next_sync_committee;

fn main(
    attested_beacon: pub BeaconHeader, 
    next_sync_committee_pubkeys_root: pub Bytes32,
    next_sync_committee_aggkey: pub Bytes48,
    next_sync_committee_branch: [Bytes32; 5],
    is_sync_committee_update: pub bool
){

    validate_next_sync_committee(
        attested_beacon,
        next_sync_committee_pubkeys_root,
        next_sync_committee_aggkey,
        next_sync_committee_branch,
        is_sync_committee_update
    );
  
}