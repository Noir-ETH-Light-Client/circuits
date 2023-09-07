fn is_branch_not_empty<N>(branch_his: [Field; N], branch_los: [Field; N]) -> bool{
    for i in 0..N{
        if(branch_his[i] != 0) return true;
        if(branch_los[i] != 0) return true;
    }
    false
}