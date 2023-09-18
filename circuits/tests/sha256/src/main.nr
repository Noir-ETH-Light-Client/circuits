use dep::std;
fn main(input: [u8; 32], expected_res: [u8; 32]) {
    let hash = std::hash::sha256(input);
    for i in 0..32{
        assert(hash[i] == expected_res[i]);
    }
}
