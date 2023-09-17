mod validate_merkle_branch;
mod is_branch_not_empty;
use dep::primitives::bytes32::Bytes32;
use dep::types::LightClientHeader;

fn validate_lc_header(fork_version: u8, lc_header: LightClientHeader){
    if(fork_version < 3){
        assert(lc_header.execution_root.is_zero());
        assert(!is_branch_not_empty::is_branch_not_empty(lc_header.execution_branch));
    }else{
        validate_merkle_branch::validate_merkle_branch(lc_header.beacon.body_root, lc_header.execution_root, 9, lc_header.execution_branch);
    }
}