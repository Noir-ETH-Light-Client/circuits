use dep::types::{LightClientHeader, BeaconHeader};
use dep::primitives::bytes32::Bytes32;
use dep::primitives::bytes48::Bytes48;
mod validate_lc_header;
mod is_branch_not_empty;
mod validate_merkle_branch;
mod hash_tree_root;
mod compute_domain;
mod compute_signing_root;
mod utils;

fn validate_lc_update(
    signature_slot: Field,
    attested_header: LightClientHeader, 
    finalized_header: LightClientHeader,
    finality_branch: [Bytes32; 6],
    next_sync_committee_pubkeys: [Bytes48; 512],
    next_sync_committee_aggkey: Bytes48,
    next_sync_committee_branch: [Bytes32; 5],
    sync_committee_bits: [bool; 512],
    sync_committee_pubkeys: [Bytes48; 512],
    sync_committee_signed_aggkey: Bytes48,
    sync_committee_signature: [u8; 96]
) -> (Bytes32, bool, bool){
    let GENESIS_VALIDATORS_ROOT: [u8; 32] = [0; 32];
    
    assert(utils::is_less_than(attested_header.beacon.slot, signature_slot));
    
    assert(!utils::is_less_than(attested_header.beacon.slot, finalized_header.beacon.slot));

    let fork_version = compute_domain::compute_fork_version(signature_slot - 1);

    validate_lc_header::validate_lc_header(fork_version, attested_header);

    let is_finality_update = is_branch_not_empty::is_branch_not_empty(finality_branch);

    if(is_finality_update){
        validate_lc_header::validate_lc_header(fork_version, finalized_header);
        let finality_root = hash_tree_root::hash_tree_root_beacon_header(finalized_header.beacon);
        validate_merkle_branch::validate_merkle_branch(attested_header.beacon.state_root, finality_root, 41, finality_branch);
    }

    let is_sync_committee_update = is_branch_not_empty::is_branch_not_empty(next_sync_committee_branch);

    if(is_sync_committee_update){
        let next_sync_committee_root = hash_tree_root::hash_tree_root_sync_committee(next_sync_committee_pubkeys, next_sync_committee_aggkey);
        validate_merkle_branch::validate_merkle_branch(attested_header.beacon.state_root, next_sync_committee_root, 23, next_sync_committee_branch);
    }

    let domain = compute_domain::compute_domain(fork_version, GENESIS_VALIDATORS_ROOT);
    let signing_root = compute_signing_root::compute_signing_root(attested_header.beacon, domain);

    // TO-DO: verify bls signature
    (signing_root, is_finality_update, is_sync_committee_update)
}