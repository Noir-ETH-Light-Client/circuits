use dep::types::BeaconHeader;
use dep::noirlib::hash_tree_root::hash_tree_root_beacon_header;
use dep::primitives::bytes32::Bytes32;


fn main(header: BeaconHeader, expected_res: Bytes32) {
    let beacon_root = hash_tree_root_beacon_header(header);
    assert(beacon_root.equal(expected_res));
}
