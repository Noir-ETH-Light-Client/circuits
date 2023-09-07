fn bitsSum<N>(bits: [bool; N]) -> u32{
    let mut result = 0;
    for i in 0..N{
        if (bits[i]){
            result = result + 1;
        }
    }
    result
}