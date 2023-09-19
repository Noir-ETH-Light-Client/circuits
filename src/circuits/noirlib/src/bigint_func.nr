use dep::std;

fn long_gt<K>(n: u64, a: [u64; K], b: [u64; K]) -> bool {
    for i = K - 1; i > 0; i-- {
        if(a[i] > b[i]) {
            return true;
        } 
        if(a[i] < b[i]) {
            return false;
        }
    }
    
    false
}

fn long_sub<K>(n: u64, a: [u64, K], b: [u64; K]) -> [u64; 50] {
    let mut diff: [u64; 50] = [0; 50];
    let mut borrow: [u64; 50] = [0; 50];

    for i in 0..K {
        if(i == 0) {
            if(a[i] >= b[i]) {
                diff[i] = a[i] - b[i];
                borrow[i] = 0;
            } else {
                diff[i] = a[i] - b[i] + (1 << n);
                borrow[i] = 1;
            }
        } else {
            if(a[i] >= b[i] + borrow[i - 1]) {
                diff[i] = a[i] - b[i] - borrow[i-1];
                borrow[i] = 0;
            } else {
                diff[i] = (1 << n) + a[i]  - b[i] - borrow[i -1];
                borrow[i] = 1;
            }
        }
    }

    diff
}

fn long_scalar_mult<K>(n: u64, a: u64, b: [u64; K]) -> [u64; 50] {
    let mut out: [u64; 50] = [0; 50];
    let mut temp = 0;
    for i in 0..K {
        temp = out[i] + (a * b[i]);
        out[i] = temp % ( 1 << n);
        out[i + 1] = out[i + 1] + tmp;
    }

    out
}

fn long_div_2<K, M>(n: u64, a: [u64; K + M], b: [u64; K]) -> [u64; 100] {
    assert(K + M < 50);
    assert(b[K - 1] != 0);

    let out_0: [u64; 50] = [0; 50];
    let out_1: [u64; 50] = [0; 50];
    let mut remainder: [u64; 50] = [0; 50];
    for i in 0..(M + K) {
        remainder[i] = a[i];
    }

    let mut dividend: [u64; 50] = [0; 50];
    let mut mult_shift: [u64; 50] = [0; 50];
    let subtrahend: [u64; 50] = [0; 50];

    for i = M; i >= 0; i-- {
        if(i == M) {
            dividend[K] = 0;
            for j = K - 1; j >= 0; j-- {
                dividend[j] = remainder[j + M];
            }
        } else {
            for j = K; j >= 0; j-- {
                dividend[j] = remainder[j + i];
            }
        }

        out_0[i] = short_div(n, K, dividend[0..(K+1)], b);
        mult_shift = long_scalar_mult(n, out_0[i], b);
        for j in (M + K) {
            subtrahend[j] = 0;
        }
        for j in 0..(K + 1) {
            if(i + j < M + K) {
                subtrahend[i + j] = mult_shift[j];
            }
        }
        remainder = long_sub(n, remainder[0..(M + K)], subtrahend[0..(M + K)]);
    }

    for i in 0..K {
        out_1[i] = remainder[i];
    }
    out_1[k] = 0;

    let out: [u64; 100] = [0; 100];
    for i in 0..50 {
        out[i] = out_0[i];
        out[i + 50] = out_1[i];
    }
    out
}

fn long_div<K, M>(n: u64, a: [u64; K + M];  b: [u64; K]) -> [u64; 100] {
    long_div_2(n, a, b);
} 

fn short_div_norm(n: u64, k: u64, a: [u64; 50], b: [u64; 50]) -> u64 {
    let qhat = (a[k] * (1 << n) + a[k - 1]) \ b[k - 1];
    if(qhat > (1 << n) - 1) {
        qhat = (1 << n) - 1;
    }

    let mut mult: [u64; 50] = long_scalar_mult(n, qhat, b);

    if(long_gt(n, mult, a) == true) {
        return qhat - 2;
    } else {
        return qhat - 1;
    }
}

fn short_div<K>(n: u64, a: [u64; K + 1], b: [u64; K]) -> u64 {

    let scale = ((1 << n) \ (1 + b[K - 1])) as Field;
    let norm_a: [u64; 50] = long_scalar_mult(n, scale, a);
    let norm_b: [u64; 50] = long_scalar_mult(n, scale, b);
    
    let ret: u64 = 0;
    if(norm_b[K] != 0) {
        ret = short_div_norm(n, K + 1, norm_a, norm_b);
    } else {
        ret = short_div_norm(n, K, norm_a, norm_b);
    }

    return ret;
} 
