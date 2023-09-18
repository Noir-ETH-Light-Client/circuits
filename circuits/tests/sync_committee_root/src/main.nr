use dep::noirlib::hash_tree_root::hash_tree_root_sync_committee;
use dep::primitives::bytes48::Bytes48;
use dep::primitives::bytes32::Bytes32;


fn main(
   pubkeys_root: Bytes32,
   aggkey: Bytes48,
   expected_res: Bytes32
) {
    let root = hash_tree_root_sync_committee(pubkeys_root, aggkey);
    assert(root.equal(expected_res));
}
