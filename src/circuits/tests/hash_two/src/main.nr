use dep::noirlib::utils;
fn main(x : [Field; 2], y : [Field; 2], expected_res: pub [Field; 2]){
    let res = utils::hash_two([x[0], y[0]], [x[1], y[1]]);
    assert(res[0] == expected_res[0]);
    assert(res[1] == expected_res[1]);
}
