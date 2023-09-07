use dep::noirlib::{is_valid_merkle_branch};
fn main(root: [Field; 2], leaf: [Field; 2], index: Field, branch_his: [Field; 8], branch_los: [Field; 8]){
    is_valid_merkle_branch::is_valid_merkle_branch(root, leaf, index, branch_his, branch_los);
}