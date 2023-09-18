use dep::primitives::bytes32::Bytes32;
use dep::std::hash::sha256;
mod utils;

fn compute_fork_version(slot: Field) -> u8{
    let mut fork_version: u8 = 0;
    if(utils::is_less_than(slot, 74240)){
        fork_version = 0;
    }else if (utils::is_less_than(slot, 144896)) {
        fork_version = 1;
    }else if (utils::is_less_than(slot, 194048)){
        fork_version = 2;
    }else{
        fork_version = 3;
    }
    fork_version
}

fn compute_domain(fork_version: u8, genesis_validators_root: [u8; 32]) -> Bytes32{
    let mut digest: [u8; 64] = [0; 64];
    digest[0] = fork_version;
    for i in 0..32{
        digest[i + 32] = genesis_validators_root[i];
    }
    let fork_data_root = sha256(digest);

    let mut res_bytes: [u8; 32] = [0; 32];
    res_bytes[0] = 7;
    for i in 0..28{
        res_bytes[i + 4] = fork_data_root[i];
    }
    Bytes32::from_le_bytes(res_bytes)
}