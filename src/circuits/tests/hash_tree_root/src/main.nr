use dep::noirlib::{hash_tree_root, bytes_repr};
fn main(his: [Field; 8], los: [Field; 8], expected_res: [Field; 2]){
    let hash = hash_tree_root::hash_tree_root(his, los);
    assert(hash[0] == expected_res[0]);
    assert(hash[1] == expected_res[1]);
}