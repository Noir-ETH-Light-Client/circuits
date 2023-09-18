use dep::primitives::bytes64::Bytes64;

fn bits_sum(bits: Bytes64) -> u32{
    let mut result = 0;
    let x0_bits = bits.x0.to_le_bits(128);
    let x1_bits = bits.x1.to_le_bits(128);
    let x2_bits = bits.x2.to_le_bits(128);
    let x3_bits = bits.x3.to_le_bits(128);
    for i in 0..128{
        if (x0_bits[i] == 1){
            result = result + 1;
        }
        if (x1_bits[i] == 1){
            result = result + 1;
        }
        if (x2_bits[i] == 1){
            result = result + 1;
        }
        if (x3_bits[i] == 1){
            result = result + 1;
        }
    }
    result
}