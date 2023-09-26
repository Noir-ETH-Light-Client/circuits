use dep::types::{LightClientHeader, BeaconHeader};
use dep::primitives::bytes32::Bytes32;
mod validate_lc_header;
mod is_branch_not_empty;
mod validate_merkle_branch;
mod hash_tree_root;
mod utils;

fn validate_finality(
    attested_beacon: BeaconHeader, 
    finalized_header: LightClientHeader,
    finality_branch: [Bytes32; 6],
    is_finality_update: bool
){
    
    assert(!utils::is_less_than(attested_beacon.slot, finalized_header.beacon.slot));

    assert(is_finality_update == is_branch_not_empty::is_branch_not_empty(finality_branch));

    if(is_finality_update){
        validate_lc_header::validate_lc_header(finalized_header);
        let finality_root = hash_tree_root::hash_tree_root_beacon_header(finalized_header.beacon);
        validate_merkle_branch::validate_merkle_branch(attested_beacon.state_root, finality_root, 41, finality_branch);
    }
    
}