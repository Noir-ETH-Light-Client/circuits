mod utils;
mod bytes_repr;

fn big_less_than<N, K>(a: [Field; K], b: [Field; K]) -> u1{
    
    let lt: [u1; K] = [0; K];
    let eq: [u1; K] = [0; K];
    for i in 0..K {
        if (a[i] < b[i]) {
            lt[i] = 1;
            eq[i] = 0;
        } else if(a[i] == b[i]) {
            lt[i] = 0;
            eq[i] = 1;
        } else {
            lt[i] = 0;
            eq[i] = 0;
        }
    }

    let mut ors: [u1; K - 1] = [0; K - 1];
    let mut ands: [u1; K - 1] = [0; K - 1];
    let mut eq_ands: [u1; K - 1] = [0; K - 1];
    for i = K - 2; i >= 0; i-- {
        if(i == K - 2) {
            ands[i] = eq[K - 1] * lt[K - 2];
            eq_ands[i] = eq[K - 1] * eq[K - 2];
            ors[i] = lt[K - 1] +  ands[i] - lt[K - 1] *  ands[i];
        } else {
            ands[i] = eq_ands[i + 1] * lt[i];
            eq_ands[i] = eq_ands[i + 1] * eq[i];
            ors[i] = ors[i + 1] + * ands[i] - ors[i + 1] * ands[i];
        }
    }

    ors[0].out
}

fn big_mod<N, K>(a_0: [Field; K], a_1: [Field; K], b: [Field; K]) -> [u1; K + 1], [u1; K] {
    assert(n <= 126);

} 

