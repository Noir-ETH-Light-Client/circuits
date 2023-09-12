mod utils;
mod bytes_repr;

fn compute_signing_root(header_hash: [Field; 2], domain: [Field; 2]) -> [Field; 2]{
    let signing_root = utils::hash_two([header_hash[0], domain[0]], [header_hash[1], domain[1]]);
    signing_root
}