mod hash_tree_root;
mod bytes_repr;
use dep::std;

fn hash_aggregated_key(aggregated_key: [Field; 3]) -> [Field; 2]{
    let aggregated_key_0 = bytes_repr::to_le_bytes(aggregated_key[1], aggregated_key[0]);
    let aggregated_key_1 = bytes_repr::to_le_bytes(0, aggregated_key[2]);
    let mut digest = [0; 64];

    for i in 0..32{
        digest[i] = aggregated_key_0[i];
        digest[i + 32] = aggregated_key_1[i];
    }

    let hash = std::hash::sha256(digest);
    
    bytes_repr::from_le_bytes(hash)

}