use dep::noirlib::{compute_signing_root};
fn main(headerHash: [Field; 2], domain: [Field; 2], expected_res: [Field; 2]){
    let signing_root = compute_signing_root::compute_signing_root(headerHash, domain);
    assert(signing_root[0] == expected_res[0]);
    assert(signing_root[1] == expected_res[1]);
}

// #[test]
// fn test_main() {
//     main(1, 2);

//     // Uncomment to make test fail
//     // main(1, 1);
// }
