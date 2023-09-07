mod utils;
fn is_valid_merkle_branch<N>(root: [Field; 2], leaf: [Field; 2], index: Field, branch_his: [Field; N], branch_los: [Field; N]){
    let index_bits = index.to_le_bits(N);
    let mut cur_hi = leaf[0];
    let mut cur_lo = leaf[1];
    for i in 0..N{
        let branch_hi = branch_his[i];
        let branch_lo = branch_los[i];
        let bit = index_bits[i];

        if(bit == 0){
            let hash = utils::hash_two([cur_hi, branch_hi], [cur_lo, branch_lo]);
            cur_hi = hash[0];
            cur_lo = hash[1];
        }else {
            let hash = utils::hash_two([branch_hi, cur_hi], [branch_lo, cur_lo]);
            cur_hi = hash[0];
            cur_lo = hash[1];
        }
    }

    assert((cur_hi == root[0]) & (cur_lo == root[1]));
}