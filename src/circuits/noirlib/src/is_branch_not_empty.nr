use dep::primitives::bytes32::Bytes32;

fn is_branch_not_empty<N>(branch: [Bytes32; N]) -> bool{
    let mut res: bool = false;
    for i in 0..N{
        if(branch[i].hi != 0) {
            res = true;
        }
        if(branch[i].lo != 0) {
            res = true;
        }
    }
    false
}