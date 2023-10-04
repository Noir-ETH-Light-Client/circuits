mod utils;
use dep::primitives::bytes32::Bytes32;
use dep::primitives::bytes48::Bytes48;
use dep::types::BeaconHeader;

fn hash_tree_root<N>(leaves: [Bytes32; N]) -> Bytes32{
    let mut hashes: [Bytes32; N] = [Bytes32::zero(); N];
    for i in 0..(N/2){
        hashes[i] = utils::hash_two(leaves[2 * i] , leaves[2 * i + 1]);
    }
    let mut k = 0;
    for i in (N/2)..(N-1){
        hashes[i] = utils::hash_two(hashes[2 * k], hashes[2 * k + 1]);
        k = k + 1;
    }
    hashes[N - 2]
}

fn hash_tree_root_sync_committee(pubkeys_root: Bytes32, aggkey: Bytes48) -> Bytes32{
    let aggkey_root = utils::hash_bytes48(aggkey);
    utils::hash_two(pubkeys_root, aggkey_root)
}

fn hash_tree_root_pubkeys<N>(pubkeys: [Bytes48; N]) -> Bytes32{
    let mut pubkey_roots: [Bytes32; N] = [Bytes32::zero(); N];
    for i in 0..N{
        pubkey_roots[i] = utils::hash_bytes48(pubkeys[i]);
    }
    let pubkeys_root = hash_tree_root(pubkey_roots);
    pubkeys_root
}

fn hash_tree_root_beacon_header(header: BeaconHeader) -> Bytes32{
    let mut leaves: [Bytes32; 8] = [Bytes32::zero(); 8];
    leaves[0] = Bytes32{hi: 0, lo: header.slot};
    leaves[1] = Bytes32{hi: 0, lo: header.proposer_index};
    leaves[2] = header.parent_root;
    leaves[3] = header.state_root;
    leaves[4] = header.body_root;
    hash_tree_root(leaves)
}