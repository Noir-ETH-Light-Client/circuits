use dep::types::BeaconHeader;
use dep::primitives::bytes32::Bytes32;
use dep::primitives::bytes48::Bytes48;
mod is_branch_not_empty;
mod validate_merkle_branch;
mod hash_tree_root;

fn validate_next_sync_committee(
    attested_beacon: BeaconHeader, 
    next_sync_committee_pubkeys_root: Bytes32,
    next_sync_committee_aggkey: Bytes48,
    next_sync_committee_branch: [Bytes32; 5],
    is_sync_committee_update: bool
){

    assert(is_sync_committee_update == is_branch_not_empty::is_branch_not_empty(next_sync_committee_branch));

    if(is_sync_committee_update){
        let next_sync_committee_root = hash_tree_root::hash_tree_root_sync_committee(next_sync_committee_pubkeys_root, next_sync_committee_aggkey);
        validate_merkle_branch::validate_merkle_branch(attested_beacon.state_root, next_sync_committee_root, 23, next_sync_committee_branch);
    }
  
}