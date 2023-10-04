use dep::noirlib::hash_tree_root;
use dep::primitives::bytes32::Bytes32;
fn main(leaves: [Bytes32; 8], expected_res: Bytes32){
    let hash = hash_tree_root::hash_tree_root(leaves);
    assert(hash.equal(expected_res));
}