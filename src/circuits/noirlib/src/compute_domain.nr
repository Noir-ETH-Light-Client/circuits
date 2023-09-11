mod utils;
mod bytes_repr;

fn compute_domain(fork_version: [u8; 4], GENESIS_VALIDATORS_ROOT: [Field; 2], DOMAIN_SYNC_COMMITTEE: [u8; 4]) -> [Field; 2]{
    let mut fork_version_uint8Array: [u8; 32] = [0; 32];
    for i in 0..4 {
        fork_version_uint8Array[i] = fork_version[i];
    }

    for i in 4..32 {
        fork_version_uint8Array[i] = 0;
    }

    let fork_version_bytes = bytes_repr::from_le_bytes(fork_version_uint8Array);

    let hash_two = utils::hash_two([fork_version_bytes[0], GENESIS_VALIDATORS_ROOT[0]], [fork_version_bytes[1], GENESIS_VALIDATORS_ROOT[1]]);
    let hash_two_uint8Array = bytes_repr::to_le_bytes(hash_two[0], hash_two[1]);
    let mut domain_uint8Array: [u8; 32] = [0; 32];

    for i in 0..4 {
        domain_uint8Array[i] = DOMAIN_SYNC_COMMITTEE[i];
    }
    for i in 4..32 {
        domain_uint8Array[i] = hash_two_uint8Array[i-4];
    }
    
    let domain = bytes_repr::from_le_bytes(domain_uint8Array);

    domain
}