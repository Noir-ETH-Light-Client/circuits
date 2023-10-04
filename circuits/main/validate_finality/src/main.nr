use dep::types::{LightClientHeader, BeaconHeader};
use dep::primitives::bytes32::Bytes32;
use dep::noirlib::validate_finality::validate_finality;

fn main(
    attested_beacon: pub BeaconHeader,
    finalized_beacon: pub BeaconHeader,
    finalized_execution_root: pub Bytes32,
    finalized_execution_branch: [Bytes32; 4],
    finality_branch: [Bytes32; 6],
    is_finality_update: pub bool,
){

    let finalized_header = LightClientHeader{
        beacon: finalized_beacon,
        execution_root: finalized_execution_root,
        execution_branch: finalized_execution_branch
    };

    validate_finality(
        attested_beacon,
        finalized_header,
        finality_branch,
        is_finality_update
    );

}