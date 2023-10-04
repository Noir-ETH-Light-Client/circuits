use dep::types::LightClientHeader;
use dep::primitives::bytes32::Bytes32;
use dep::primitives::bytes64::Bytes64;
mod validate_lc_header;
mod validate_merkle_branch;
mod compute_domain;
mod compute_signing_root;
mod utils;
mod bits_sum;

fn validate_lc_update(
    signature_slot: Field,
    attested_header: LightClientHeader, 
    sync_committee_bits: Bytes64,
    signing_root: Bytes32,
    active_participants: u32
){
    let GENESIS_VALIDATORS_ROOT: [u8; 32] = [
        75,  54,  61, 185,  78,  40,  97,  32,
        215, 110, 185,   5,  52,  15, 221,  78,
        84, 191, 233, 240, 107, 243,  63, 246,
        207,  90, 210, 127,  81,  27, 254, 149
    ];
    
    assert(utils::is_less_than(attested_header.beacon.slot, signature_slot));

    validate_lc_header::validate_lc_header(attested_header);

    let fork_version = 3;
    let domain = compute_domain::compute_domain(fork_version, GENESIS_VALIDATORS_ROOT);
    assert(signing_root.equal(compute_signing_root::compute_signing_root(attested_header.beacon, domain))); // error detected

    assert(active_participants == bits_sum::bits_sum(sync_committee_bits));
    // TO-DO: verify bls signature
    
}