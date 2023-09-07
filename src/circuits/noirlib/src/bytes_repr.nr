fn from_be_bytes(bytes: [u8; 32]) -> [Field; 2]{
    let mut hi: Field = 0;
    let mut lo: Field = 0;
    for i in 0..16 {
        hi = 256 * hi + (bytes[i] as Field);
        lo = 256 * lo + (bytes[i + 16] as Field);
    }

    let res = [hi, lo];
    res
}

fn from_le_bytes(bytes: [u8; 32]) -> [Field; 2]{
    let mut hi: Field = 0;
    let mut lo: Field = 0;
    let mut mul2: Field = 1;
    for i in 0..16 {
        hi = hi + mul2 * (bytes[i + 16] as Field);
        lo = lo + mul2 * (bytes[i] as Field);
        mul2 = mul2 * 256;
    }

    let res = [hi, lo];
    res
}

fn to_be_bytes(hi: Field, lo: Field) -> [u8; 32]{
    let hi_bytes = hi.to_be_bytes(32);
    let lo_bytes = lo.to_be_bytes(32);
    let mut res = [0; 32];
    for i in 0..16{
        res[i] = hi_bytes[i + 16];
        res[i + 16] = lo_bytes[i + 16];
    }
    res
}

fn to_le_bytes(hi: Field, lo: Field) -> [u8; 32]{
    let hi_bytes = hi.to_le_bytes(16);
    let lo_bytes = lo.to_le_bytes(16);
    let mut res = [0; 32];
    for i in 0..16{
        res[i] = lo_bytes[i];
        res[i + 16] = hi_bytes[i];
    }
    res
}