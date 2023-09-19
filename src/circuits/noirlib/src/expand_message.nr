mod bytes_repr;
mod gates;
use dep::std;

fn expand_message(input: [Field; 2]) -> [Field; 16]{
    let mut digest = [0; 143];
    let BIG_SIG_DST = [0,1,0,0,0,0,1,0,0,1,0,0,1,1,0,0,0,1,0,1,0,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,0,0,1,1,0,1,0,0,1,0,0,1,0,1,0,0,0,1,1,1,0,1,0,1,1,1,1,1,0,1,0,0,0,0,1,0,0,1,0,0,1,1,0,0,0,1,0,1,0,0,1,1,0,0,1,1,0,0,0,1,0,0,1,1,0,0,1,0,0,0,1,1,0,0,1,1,0,0,1,1,1,0,0,0,0,0,1,1,0,0,0,1,0,1,0,0,0,1,1,1,0,0,1,1,0,0,1,0,0,1,0,1,1,1,1,1,0,1,0,1,1,0,0,0,0,1,0,0,1,1,0,1,0,1,0,0,0,1,0,0,0,0,1,1,1,0,1,0,0,1,0,1,0,0,1,1,0,1,0,0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,0,0,1,1,0,1,0,1,0,0,1,1,0,1,1,0,0,1,0,1,1,1,1,1,0,1,0,1,0,0,1,1,0,1,0,1,0,0,1,1,0,1,0,1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,0,1,0,0,1,0,0,1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,0,0,0,0,0,1,0,0,1,1,1,1,0,1,0,1,0,0,0,0,0,1,0,1,1,1,1,1,0,0,1,0,1,0,1,1];
    let mut big_sig_dst_bytes: [u8; 43] = [0; 43];

    let mut k = 1;
    for i in 0..44 {
        k = 1;
        for j in 0..8 {
            big_sig_dst_bytes[i] += k * BIG_SIG_DST[i * 8 + j];
            k *= 2;
        }
    }

    let input0_bytes = bytes_repr::to_le_bytes(input[1], input[0]);
    for i in 64..96 {
        digest[i] = input0_bytes[i-64];
    }

    digest[96] = 256;

    for i in 99..143 {
        digest[i] = big_sig_dst_bytes[i - 99];
    }

    let b_0 = std::hash::sha256(digest);
    let b_0_bytes = bytes_repr::from_le_bytes(b_0);

    let mut prevDigest: [u8; 77] = [0; 77];
    for i in 0..32 {
        prevDigest[i] = b_0[i];
    }
    
    prevDigest[32] = 256;

    for i in 33..77 {
        prevDigest[i] = big_sig_dst_bytes[i - 33];
    }

    let mut prevSha256_bytes = std::hash::sha256(prevDigest);

    let mut prevSha256_los: [Field; 8] = [0; 8];
    let mut prevSha256_his: [Field; 8] = [0; 8];

    let mut prevSha256_field = bytes_repr::from_le_bytes(prevSha256_bytes);
    prevSha256_los[0] = prevSha256_field[0];
    prevSha256_his[0] = prevSha256_field[1];


    let mut xor_bytes: [u8; 32] = [0; 32];
    for index in 1..8 {
        xor_bytes = gates::xor_field_to_bytes(b_0_bytes, [prevSha256_los[index - 1], prevSha256_his[index - 1]]);
        for j in 0..32 {
            prevDigest[j] = xor_bytes[j];
        }
        prevDigest[32] = index + 1;
        prevSha256_bytes =  std::hash::sha256(prevDigest);
        prevSha256_field = bytes_repr::from_le_bytes(prevSha256_bytes);
        prevSha256_los[index] = prevSha256_field[0];
        prevSha256_his[index] = prevSha256_field[1];
    }

    let mut out: [Field; 16] = [0; 16];
    for i in 0..8 {
        out[2 * i] = prevSha256_los[i];
        out[2 * i + 1] = prevSha256_his[i];
    }
    
    out
}