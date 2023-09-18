use dep::noirlib::validate_merkle_branch;
use dep::primitives::bytes32::Bytes32;
fn main(root: Bytes32, leaf: Bytes32, index: Field, branch: [Bytes32; 8]){
    validate_merkle_branch::validate_merkle_branch(root, leaf, index, branch)
}