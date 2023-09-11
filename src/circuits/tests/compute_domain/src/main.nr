use dep::noirlib::{compute_domain};
fn main(fork_version: [u8; 4], GENESIS_VALIDATORS_ROOT: [Field; 2], DOMAIN_SYNC_COMMITTEE: [u8; 4], expected_res: [Field; 2]){
    let domain = compute_domain::compute_domain(fork_version, GENESIS_VALIDATORS_ROOT, DOMAIN_SYNC_COMMITTEE);
    assert(domain[0] == expected_res[0]);
    assert(domain[1] == expected_res[1]);
}

// #[test]
// fn test_main() {
//     main(1, 2);

//     // Uncomment to make test fail
//     // main(1, 1);
// }
