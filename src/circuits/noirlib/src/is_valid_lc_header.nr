mod is_valid_merkle_branch;
fn is_valid_lc_header(body_root: [Field; 2], execution_root: [Field; 2], execution_his_branch: [Field; 4], execution_los_branch: [Field; 4]){
    is_valid_merkle_branch(body_root, execution_root, 9, execution_his_branch, execution_los_branch);
}