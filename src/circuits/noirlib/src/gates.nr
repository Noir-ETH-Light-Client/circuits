use dep::std;
mod bytes_repr;

fn xor_field_to_bytes(in_los: [Field; 2], in_his: [Field; 2]) -> [u8; 32] {
    let in_los_0 = in_los[0].to_le_bits(128);
    let in_los_1 = in_los[1].to_le_bits(128);
    let in_his_0 = in_his[0].to_le_bits(128);
    let in_his_1 = in_his[1].to_le_bits(128);
    let mut res_bits: [u1; 256] = [0; 256];
    for i in 0..128 {
        res_bits[i] = in_los_0[i] + in_his_0[i] - 2 * in_his_0[i] * in_los_0[i];
        res_bits[i + 128] = in_los_1[i] + in_his_1[i] - 2 * in_his_1[i] * in_los_1[i];
    }

    let mut res_bytes: [u8; 32] = [0; 32];

    let mut k = 1;
    for i in 0..32 {
        k = 1;
        for j in 0..8 {
            res_bytes[i] += (res_bits[i * 8 + j] as u8) * k;
            k *= 2;
        }
    }

    res_bytes
}

fn and_field_to_bytes(in_los: [Field; 2], in_his: [Field; 2]) -> [u8; 32] {
    let in_los_0 = in_los[0].to_le_bits(128);
    let in_los_1 = in_los[1].to_le_bits(128);
    let in_his_0 = in_his[0].to_le_bits(128);
    let in_his_1 = in_his[1].to_le_bits(128);
    let mut res_bits: [u1; 256] = [0; 256];
    for i in 0..128 {
        res_bits[i] = in_his_0[i] * in_los_0[i];
        res_bits[i + 128] =  in_his_1[i] * in_los_1[i];
    }

    let mut res_bytes: [u8; 32] = [0; 32];

    let mut k = 1;
    for i in 0..32 {
        k = 1;
        for j in 0..8 {
            res_bytes[i] += (res_bits[i * 8 + j] as u8) * k;
            k *= 2;
        }
    }

    res_bytes
}

fn or_field_to_bytes(in_los: [Field; 2], in_his: [Field; 2]) -> [u8; 32] {
    let in_los_0 = in_los[0].to_le_bits(128);
    let in_los_1 = in_los[1].to_le_bits(128);
    let in_his_0 = in_his[0].to_le_bits(128);
    let in_his_1 = in_his[1].to_le_bits(128);
    let mut res_bits: [u1; 256] = [0; 256];
    for i in 0..128 {
        res_bits[i] = in_los_0[i] + in_his_0[i] - in_his_0[i] * in_los_0[i];
        res_bits[i + 128] = in_los_1[i] + in_his_1[i] -  in_his_1[i] * in_los_1[i];
    }

    let mut res_bytes: [u8; 32] = [0; 32];

    let mut k = 1;
    for i in 0..32 {
        k = 1;
        for j in 0..8 {
            res_bytes[i] += (res_bits[i * 8 + j] as u8) * k;
            k *= 2;
        }
    }

    res_bytes
}

fn not_field_to_bytes(ins: [Field; 2]) -> [u8; 32] {
    let ins_0 = ins[0].to_le_bits(128);
    let ins_1 = ins[1].to_le_bits(128);
    let mut res_bits: [u1; 256] = [0; 256];
    for i in 0..128 {
        res_bits[i] = 1 + ins_0[i] - 2 * ins_0[i];
        res_bits[i + 128] = 1 + ins_1[i] - 2 * ins_1[i];
    }

    let mut res_bytes: [u8; 32] = [0; 32];

    let mut k = 1;
    for i in 0..32 {
        k = 1;
        for j in 0..8 {
            res_bytes[i] += (res_bits[i * 8 + j] as u8) * k;
            k *= 2;
        }
    }

    res_bytes
}

fn nand_field_to_bytes(in_los: [Field; 2], in_his: [Field; 2]) -> [u8; 32] {
    let in_los_0 = in_los[0].to_le_bits(128);
    let in_los_1 = in_los[1].to_le_bits(128);
    let in_his_0 = in_his[0].to_le_bits(128);
    let in_his_1 = in_his[1].to_le_bits(128);
    let mut res_bits: [u1; 256] = [0; 256];
    for i in 0..128 {
        res_bits[i] = 1 - in_his_0[i] * in_los_0[i];
        res_bits[i + 128] = 1 -  in_his_1[i] * in_los_1[i];
    }

    let mut res_bytes: [u8; 32] = [0; 32];

    let mut k = 1;
    for i in 0..32 {
        k = 1;
        for j in 0..8 {
            res_bytes[i] += (res_bits[i * 8 + j] as u8) * k;
            k *= 2;
        }
    }

    res_bytes
}

fn nor_field_to_bytes(in_los: [Field; 2], in_his: [Field; 2]) -> [u8; 32] {
    let in_los_0 = in_los[0].to_le_bits(128);
    let in_los_1 = in_los[1].to_le_bits(128);
    let in_his_0 = in_his[0].to_le_bits(128);
    let in_his_1 = in_his[1].to_le_bits(128);
    let mut res_bits: [u1; 256] = [0; 256];
    for i in 0..128 {
        res_bits[i] = in_his_0[i] * in_los_0[i] + 1 - in_los_0[i] - in_his_0[i];
        res_bits[i + 128] = in_his_1[i] * in_los_1[i] + 1 - in_los_1[i] - in_his_1[i];
    }

    let mut res_bytes: [u8; 32] = [0; 32];

    let mut k = 1;
    for i in 0..32 {
        k = 1;
        for j in 0..8 {
            res_bytes[i] += (res_bits[i * 8 + j] as u8) * k;
            k *= 2;
        }
    }

    res_bytes
}