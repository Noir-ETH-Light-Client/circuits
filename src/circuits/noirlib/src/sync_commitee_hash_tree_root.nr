mod hash_tree_root;
mod hash_aggregated_key;
mod bytes_repr;
mod utils;
use dep::std;

fn sync_commitee_hash_tree_root<N>(
    points_0: [Field; N], 
    points_1: [Field; N], 
    points_2: [Field; N], 
    aggregated_key: [Field; 3]
) -> [Field; 2]{
    let mut points0_bytes: [Field, N] = [0, N];
    let mut points1_bytes: [Field, N] = [0, N];
    let mut digest = [0; 64];
    let mut hash: [u8, 32]: [0, 32];
    let mut hash_bytes: [Field, 2] = [0, 2];

    let mut leaves_los: [Field, N] = [0, N];
    let mut leves_his: [Field, N] = [0, N];

    for i in 0..N {
        points0_bytes = bytes_repr::to_le_bytes(points_1[i], points_0[i]);
        points1_bytes = bytes_repr::to_le_bytes(0, points_2[i]);
        for j in 0..32{
            digest[j] = points0_bytes[j];
            digest[j + 32] = points1_bytes[j];
        }
        hash = std::hash::sha256(digest);
        hash_bytes = bytes_repr::from_le_bytes(hash);
        leaves_los[i] = hash_bytes[0];
        leaves_his[1] = hash_bytes[1];
    }

    let hash_tree_root = hash_tree_root::hash_tree_root(leaves_los, leaves_his);
    let hash_key = hash_aggregated_key::hash_aggregated_key(aggregated_key);
    let hasher = utils::hash_two([hash_tree_root[0], hash_key[0]], [hash_tree_root[1], hash_key[1]]);
    
    hasher
}