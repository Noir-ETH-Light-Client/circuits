use dep::types::BeaconHeader;
use dep::primitives::bytes32::Bytes32;
mod hash_tree_root;
mod utils;

fn compute_signing_root(header: BeaconHeader, domain: Bytes32) -> Bytes32{
    let header_root = hash_tree_root::hash_tree_root_beacon_header(header);
    utils::hash_two(header_root, domain)
}