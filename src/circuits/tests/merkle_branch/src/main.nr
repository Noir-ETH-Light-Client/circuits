use dep::noirlib::is_valid_merkle_branch;
use dep::primitives::bytes32::Bytes32;
fn main(root: Bytes32, leaf: Bytes32, index: Field, branch: [Bytes32; 8]){
    is_valid_merkle_branch::is_valid_merkle_branch(root, leaf, index, branch)
}