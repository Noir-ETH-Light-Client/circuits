use dep::noirlib::utils;
use dep::primitives::bytes32::Bytes32;
fn main(x : Bytes32, y : Bytes32, expected_res: pub Bytes32){
    let res = utils::hash_two(x, y);
    assert(res.equal(expected_res));
    let slot = 5 * 8192;
    let period = utils::slot_to_period(slot);
    assert(period == 5);
}
