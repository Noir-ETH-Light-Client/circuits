import BeaconAPI from "./beacon-api/index.js";
import { readFileSync } from "fs";
import { expect } from "chai";
import { CAPELLA_FORK_VERSION } from "./constants/index.js";
import Field from "./primitives/field.js";
import computeDomain from "./domain/compute-domain.js";
import hashTwo from "./hash/hash-two.js";
import BeaconHeader from "./beacon/beacon-header.js";
import { slotToForkVersion } from "./converter/time.js";
import beaconRootCircuit from "./circuits/tests/beacon_root/target/beacon_root.json" assert { type: "json" };
import signingRootCircuit from "./circuits/tests/signing_root/target/signing_root.json" assert { type: "json" };
// import hashPubkeysCircuit from "./circuits/tests/hash_pubkeys/target/hash_pubkeys.json" assert { type: "json" };
import hashSyncCommCircuit from "./circuits/tests/sync_committee_root/target/sync_committee_root.json" assert { type: "json" };
import { convertToHexAndPad } from "./converter/numeric.js";
import { validateWitness } from "./berretenberg-api/index.js";
import SyncCommittee from "./beacon/sync-committee.js";

describe("test signing from beacon api", () => {
  let beaconAPI: BeaconAPI;
  let lcUpdates: any;
  let bootstrapState: any;
  const bootstrapFile = "bootstrap-state.json";
  before("download lc updates and load bootstrap state", async () => {
    beaconAPI = new BeaconAPI();
    lcUpdates = await beaconAPI.downloadLCUpdates(700);
    bootstrapState = JSON.parse(readFileSync(bootstrapFile, "utf-8"));
  });

  it("test beacon root", async () => {
    const update = lcUpdates.data[0];

    const attestedBeacon = new BeaconHeader(update.data.attested_header.beacon);

    const inputs = [
      ...attestedBeacon.flat,
      ...attestedBeacon.hashTreeRoot.hilo,
    ];

    const witness = new Map<number, string>();
    inputs.forEach((input, index) => {
      witness.set(index + 1, convertToHexAndPad(input));
    });
    console.log(witness);
    const verified = await validateWitness(witness, beaconRootCircuit);
    expect(verified).to.be.true;
  });

  it("test sync committee hash tree root", async () => {
    const nextSyncCommittee = new SyncCommittee(
      bootstrapState.data.next_sync_committee
    );

    const allRoots = nextSyncCommittee.allRoots;
    
    const rootInputs = [
      ...allRoots.pubkeysRoot.hilo,
      ...nextSyncCommittee.aggregateKey.hilo,
      ...allRoots.hashTreeRoot.hilo
    ]

    const rootWitness = new Map<number, string>();
    rootInputs.forEach((input, index) => {
      rootWitness.set(index + 1, convertToHexAndPad(input));
    });
    const rootVerified = await validateWitness(rootWitness, hashSyncCommCircuit);
    expect(rootVerified).to.be.true;
  });

  it("test signing root", async () => {
    const update = lcUpdates.data[0];

    const genesisValidatorsRoot = Field.fromSSZ(
      bootstrapState.data.genesis_validators_root
    );

    console.log(genesisValidatorsRoot.value);

    const attestedBeacon = new BeaconHeader(update.data.attested_header.beacon);
    const signatureSlot = Number(update.data.signature_slot);
    const forkVersion = slotToForkVersion(signatureSlot - 1);
    expect(forkVersion).to.be.equal(CAPELLA_FORK_VERSION);

    const domain = computeDomain(signatureSlot - 1, genesisValidatorsRoot);
    const signingRoot = hashTwo(attestedBeacon.hashTreeRoot, domain);

    const inputs = [
      ...attestedBeacon.flat,
      // signatureSlot - 1,
      ...signingRoot.hilo,
    ];

    const witness = new Map<number, string>();
    inputs.forEach((input, index) => {
      witness.set(index + 1, convertToHexAndPad(input));
    });
    console.log(witness);
    const verified = await validateWitness(witness, signingRootCircuit);
    expect(verified).to.be.true;
  });
});
