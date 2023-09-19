mod utils;
mod bytes_repr;

fn compress(point_0: [Field; 7], point_1: [Field; 7]) -> [u1; 384]{
    let mut prime: [Field; 7] = [0; 7];
    prime[0] = 35888059530597717;
    prime[1] = 36027359614205881;
    prime[2] = 18556878317960535;
    prime[3] = 21977360498475850;
    prime[4] = 26290126778424359;
    prime[5] = 29735955799434292;
    prime[6] = 914940731273212;
    
    // signal lessThan <== BigLessThan(55, 7)(prime, point[1]);
    let lessThan = 1;
    let mut bits: [u1; 384] = [0; 384];
    let mut point_0_bits: [u1; 55] = [0; 55];
    for i in 0..7 {
        point_0_bits = point_0.to_le_bits(55);
        for j = 0; (j < 55 && i < 6) || j < 51; j++ {
            bits[383 - i * 55 -j] <== point_0_bits[j];
        }
    }

    bits[0] = 1;
    bits[1] = 0;
    bits[2] = lessThan;
}