struct Bytes96{
    x0: Field,
    x1: Field,
    x2: Field,
    x3: Field
}

impl Bytes96{
    fn zero() -> Self{
        Bytes96{
            x0: 0, x1: 0, x2: 0, x3: 0
        }
    }
    

fn from_le_bytes(bytes: [u8; 96]) -> Self{
    let mut x0: Field = 0;
    let mut x1: Field = 0;
    let mut x2: Field = 0;
    let mut x3: Field = 0;
    let mut mul2: Field = 1;
    for i in 0..24 {
        x3 = x3 + mul2 * (bytes[i + 72] as Field);
        x2 = x2 + mul2 * (bytes[i + 48] as Field);
        x1 = x1 + mul2 * (bytes[i + 24] as Field);
        x0 = x0 + mul2 * (bytes[i] as Field);
        mul2 = mul2 * 256;
    }

    let res = Bytes96{
        x0: x0,
        x1: x1,
        x2: x2,
        x3: x3
    };
    res
}


fn to_le_bytes(value: Self) -> [u8; 96]{
    let x0_bytes = value.x0.to_le_bytes(24);
    let x1_bytes = value.x1.to_le_bytes(24);
    let x2_bytes = value.x2.to_le_bytes(24);
    let x3_bytes = value.x3.to_le_bytes(24);

    let mut res = [0; 96];
    for i in 0..24{
        res[i] = x0_bytes[i];
        res[i + 24] = x1_bytes[i];
        res[i + 48] = x2_bytes[i];
        res[i + 72] = x3_bytes[i];
    }
    res
}
}