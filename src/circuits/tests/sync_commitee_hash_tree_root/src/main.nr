use dep::noirlib::sync_commitee_hash_tree_root;
fn main(points : [Field; 12], aggregated_key : [Field; 3], expected_res: pub [Field; 2]){
    let mut points_0: [Field; 4] = [0; 4];
    let mut points_1: [Field; 4] = [0; 4];
    let mut points_2: [Field; 4] = [0; 4];

    for i in 0..4 {
        points_0[i] = points[i];
        points_1[i] = points[i + 4];
        points_2[i] = points[i + 8];
    }
    let res = sync_commitee_hash_tree_root::sync_commitee_hash_tree_root(points_0, points_1, points_2, aggregated_key);
    assert(res[0] == expected_res[0]);
    assert(res[1] == expected_res[1]);
}
