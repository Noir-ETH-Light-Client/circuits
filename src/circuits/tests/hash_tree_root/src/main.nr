use dep::noirlib::{hash_tree_root, bytes_repr};
fn main(his: [Field; 8], los: [Field; 8]) -> pub [u8; 32]{
    let (hi, lo) = hash_tree_root::hash_tree_root(his, los);
    bytes_repr::to_le_bytes(hi, lo)
}