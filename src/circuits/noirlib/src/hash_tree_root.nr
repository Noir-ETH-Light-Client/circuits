mod utils;

fn hash_tree_root<N>(his: [Field; N], los: [Field; N]) -> (Field, Field){
    let mut lo_hashes: [Field; N] = [0; N];
    let mut hi_hashes: [Field; N] = [0; N];
    for i in 0..(N/2){
        let hash = utils::hash_two([his[2 * i], his[2 * i + 1]], [los[2 * i], los[2 * i + 1]]);
        lo_hashes[i] = hash[1];
        hi_hashes[i] = hash[0];
    }
    let mut k = 0;
    for i in (N/2)..(N-1){
        let hash = utils::hash_two([hi_hashes[2 * k], hi_hashes[2 * k + 1]], [lo_hashes[2 * k], lo_hashes[2 * k + 1]]);
        lo_hashes[i] = hash[1];
        hi_hashes[i] = hash[0];
        k = k + 1;
    }
    let res = (hi_hashes[N-2], lo_hashes[N-2]);
    res
}