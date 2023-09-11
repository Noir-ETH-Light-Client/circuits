fn bits_sum<N>(bits: [bool; N]) -> u32{
    let mut result = 0;
    for i in 0..N{
        if (bits[i]){
            result = result + 1;
        }
    }
    result
}

#[test]
fn test_bits_sum(){
    let bits = [true, false, true, false, false, true, false];
    let sum = bits_sum(bits);
    assert(sum == 3);
}