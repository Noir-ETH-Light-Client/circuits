mod utils;
use dep::primitives::bytes32::Bytes32;
fn validate_merkle_branch<N>(root: Bytes32, leaf: Bytes32, index: Field, branch: [Bytes32; N]){
    let index_bits = index.to_le_bits(N);
    let mut cur = leaf;
    for i in 0..N{
        let bit = index_bits[i];

        if(bit == 0){
            cur = utils::hash_two(cur, branch[i]);
        }else {
            cur = utils::hash_two(branch[i], cur);
        }
    }

    assert(cur.equal(root));
}