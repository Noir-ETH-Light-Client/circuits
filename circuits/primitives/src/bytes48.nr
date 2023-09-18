struct Bytes48{
    hi: Field,
    lo: Field
}

impl Bytes48{
    fn zero() -> Self{
        Bytes48{
            hi: 0, lo: 0
        }
    }

    fn equal(self: Self, other: Self)-> bool{
        (self.hi == other.hi) & (self.lo == other.lo)
    }
    
fn from_be_bytes(bytes: [u8; 48]) -> Self{
    let mut hi: Field = 0;
    let mut lo: Field = 0;
    for i in 0..24 {
        hi = 256 * hi + (bytes[i] as Field);
        lo = 256 * lo + (bytes[i + 24] as Field);
    }

    let res = Bytes48{
        hi: hi,
        lo: lo,
    };
    res
}

fn from_le_bytes(bytes: [u8; 48]) -> Self{
    let mut hi: Field = 0;
    let mut lo: Field = 0;
    let mut mul2: Field = 1;
    for i in 0..24 {
        hi = hi + mul2 * (bytes[i + 24] as Field);
        lo = lo + mul2 * (bytes[i] as Field);
        mul2 = mul2 * 256;
    }

    let res = Bytes48{
        hi: hi,
        lo: lo,
    };
    res
}

fn to_be_bytes(value: Self) -> [u8; 48]{
    let hi_bytes = value.hi.to_be_bytes(32);
    let lo_bytes = value.lo.to_be_bytes(32);
    let mut res = [0; 48];
    for i in 0..24{
        res[i] = hi_bytes[i + 24];
        res[i + 24] = lo_bytes[i + 24];
    }
    res
}

fn to_le_bytes(value: Self) -> [u8; 48]{
    let hi_bytes = value.hi.to_le_bytes(24);
    let lo_bytes = value.lo.to_le_bytes(24);
    let mut res = [0; 48];
    for i in 0..24{
        res[i] = lo_bytes[i];
        res[i + 24] = hi_bytes[i];
    }
    res
}
}