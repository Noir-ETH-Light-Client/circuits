use dep::std;
mod bytes_repr;

fn hash_two(his: [Field; 2], los: [Field; 2]) -> [Field; 2]{
    let input0_bytes = bytes_repr::to_le_bytes(his[0], los[0]);
    let input1_bytes = bytes_repr::to_le_bytes(his[1], los[1]);
    let mut digest = [0; 64];
        for i in 0..32{
            digest[i] = input0_bytes[i];
            digest[i + 32] = input1_bytes[i];
        }
    let hash = std::hash::sha256(digest);
    bytes_repr::from_le_bytes(hash)
}


