use dep::types::BeaconHeader;
use dep::noirlib::compute_domain;
use dep::noirlib::{utils, compute_signing_root};
use dep::primitives::bytes32::Bytes32;


fn main(
    header: BeaconHeader, 
    // slot: Field, 
    expected_res: Bytes32
) {
    let GENESIS_VALIDATORS_ROOT: [u8; 32] = [
        75,  54,  61, 185,  78,  40,  97,  32,
        215, 110, 185,   5,  52,  15, 221,  78,
        84, 191, 233, 240, 107, 243,  63, 246,
        207,  90, 210, 127,  81,  27, 254, 149
    ];

    let fork_version = 3;
    let domain = compute_domain::compute_domain(fork_version, GENESIS_VALIDATORS_ROOT);
    let signing_root = compute_signing_root::compute_signing_root(header, domain);
    assert(signing_root.equal(expected_res));
}
