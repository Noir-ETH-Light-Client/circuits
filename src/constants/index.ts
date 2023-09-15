export const FINALIZED_ROOT_DEPTH = 6;
export const FINALIZED_ROOT_INDEX = 41;
export const NEXT_SYNC_COMMITTEE_DEPTH = 5;
export const NEXT_SYNC_COMMITTEE_INDEX = 23;
export const DOMAIN_SYNC_COMMITTEE = [7, 0, 0, 0];
export const GENESIS_SLOT = 0;
export const MIN_SYNC_COMMITTEE_PARTICIPANTS = 1;
export const SYNC_COMMITTEES_DEPTH = 4;
export const SYNC_COMMITTEES_INDEX = 11;
export const SYNC_COMMITTEE_SIZE = 512;
export const EXECUTION_PAYLOAD_DEPTH = 4;
export const EXECUTION_PAYLOAD_INDEX = 9;

// forks
// Mainnet initial fork version, recommend altering for testnets
export const GENESIS_FORK_VERSION = 0x00000000;
// 604800 seconds (7 days)
export const GENESIS_DELAY = 604800;

// Forking
// ---------------------------------------------------------------
// Some forks are disabled for now:
//  - These may be re-assigned to another fork-version later
//  - Temporarily set to max uint64 value: 2**64 - 1

// Altair
export const ALTAIR_FORK_VERSION = 0x01000000;
export const ALTAIR_FORK_EPOCH = 74240; // Oct 27, 2021, 10:56:23am UTC
// Bellatrix
export const BELLATRIX_FORK_VERSION = 0x02000000;
export const BELLATRIX_FORK_EPOCH = 144896; // Sept 6, 2022, 11:34:47am UTC

// Capella
export const CAPELLA_FORK_VERSION = 0x03000000;
export const CAPELLA_FORK_EPOCH = 194048; // April 12 (epoch: 194048    slot: 6209536    UTC: 4/12/2023, 10:27:35 PM)

// DENEB
export const DENEB_FORK_VERSION = 0x04000000;
export const DENEB_FORK_EPOCH = Number.MAX_VALUE;

export const SECONDS_PER_SLOT = 12;
export const SLOTS_PER_EPOCH = 32;
export const EPOCH_PER_PERIOD = 256;
