use dep::primitives::bytes32::Bytes32;

struct BeaconHeader{
    slot: Field,
    proposer_index: Field,
    parent_root: Bytes32,
    state_root: Bytes32,
    body_root: Bytes32,
}

struct LightClientHeader{
    beacon: BeaconHeader,
    execution_root: Bytes32,
    execution_branch: [Bytes32; 4],
}