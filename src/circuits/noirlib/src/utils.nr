use dep::std;
use dep::primitives::bytes32::Bytes32;
use dep::primitives::bytes48::Bytes48;

fn hash_two(x: Bytes32, y: Bytes32) -> Bytes32{
    let x_bytes = x.to_le_bytes();
    let y_bytes = y.to_le_bytes();
    let mut digest = [0; 64];
        for i in 0..32{
            digest[i] = x_bytes[i];
            digest[i + 32] = y_bytes[i];
        }
    let hash = std::hash::sha256(digest);
    Bytes32::from_le_bytes(hash)
}

fn hash_bytes48(x: Bytes48) -> Bytes32{
    let x_bytes = x.to_le_bytes();
    let mut digest = [0; 64];
        
    for i in 0..48{
        digest[i] = x_bytes[i];
    }

    for i in 48..64{
        digest[i] = 0;
    }

    let hash = std::hash::sha256(digest);

    Bytes32::from_le_bytes(hash)
}

fn slot_to_period(slot: Field) -> Field{
    slot / 8192
}

fn is_less_than(x: Field, y: Field) -> bool{
    let x_bytes = x.to_le_bytes(32);
    let y_bytes = y.to_le_bytes(32);
    let mut res = false;
    for i in 0..32{
        if(!res){
            if(x_bytes[i] < y_bytes[i]){
                res = true;
            }
        }
    }
    res
}