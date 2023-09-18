use dep::noirlib::hash_tree_root::hash_tree_root_pubkeys;
use dep::primitives::bytes48::Bytes48;
use dep::primitives::bytes32::Bytes32;


fn main(
   pubkeys: [Bytes48; 256],
   expected_res: Bytes32
) {
    let root = hash_tree_root_pubkeys(pubkeys);
    assert(root.equal(expected_res));
}
