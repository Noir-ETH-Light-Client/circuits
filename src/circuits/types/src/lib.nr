fn my_util(x : Field, y : Field) -> bool {
    x != y
}

#[test]
fn test_my_util() {
    assert(my_util(1, 2));

    // Uncomment to make test fail
    // assert(my_util(1, 1));
}
