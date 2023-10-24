import hashMerkleBranch from "../hash/hash-merkle-brach.js";
import {
  EXECUTION_PAYLOAD_DEPTH,
  FINALIZED_ROOT_DEPTH,
  FINALIZED_ROOT_INDEX,
  MIN_SYNC_COMMITTEE_PARTICIPANTS,
  NEXT_SYNC_COMMITTEE_DEPTH,
  NEXT_SYNC_COMMITTEE_INDEX,
  SYNC_COMMITTEE_SIZE,
} from "../constants/index.js";
import BLSSignature from "../beacon/bls-signature.js";
import SyncCommittee from "../beacon/sync-committee.js";
import Field from "../primitives/field.js";
import VariableLengthField from "../primitives/variable-length-field.js";
import LightClientHeader from "./lc-header.js";
import {
  InvalidLCMessage,
  IsLCUpdateValid,
  LightClientUpdateObject,
  LightClientUpdateSummary,
} from "../index.js";
import computeDomain from "../domain/compute-domain.js";
import hashTwo from "../hash/hash-two.js";
import executionHashTreeRoot from "../hash/hash-execution.js";
import { convertToHexAndPad } from "../converter/numeric.js";
import validateLCUpdateCircuit from "../circuit-abis/validate_lc_update.json" assert { type: "json" };
import validateFinalityCircuit from "../circuit-abis/validate_finality.json" assert { type: "json" };
import validateNextSyncCommCircuit from "../circuit-abis/validate_next_sync_committee.json" assert { type: "json" };
import { generateProof } from "../berretenberg-api/index.js";

export default class LightClientUpdate {
  readonly signatureSlot: Field;
  readonly attestedHeader: LightClientHeader;
  readonly nextSyncCommittee: SyncCommittee;
  readonly nextSyncCommitteeBranch: Array<Field>;
  readonly finalizedHeader: LightClientHeader;
  readonly finalityBranch: Array<Field>;
  readonly syncCommitteeBits: VariableLengthField;
  readonly syncCommitteeSignature: BLSSignature;

  constructor(
    signatureSlot: string,
    attestedHeader: LightClientHeader,
    nextSyncCommittee: SyncCommittee,
    nextSyncCommitteeBranch: Array<string>,
    finalizedHeader: LightClientHeader,
    finalityBranch: Array<string>,
    syncCommitteeBits: string,
    syncCommitteeSignature: string
  ) {
    if (nextSyncCommitteeBranch.length !== NEXT_SYNC_COMMITTEE_DEPTH)
      throw new Error(
        `Expect the next sync committee branch length to be ${NEXT_SYNC_COMMITTEE_DEPTH}, but got ${nextSyncCommitteeBranch.length}`
      );
    if (finalityBranch.length !== FINALIZED_ROOT_DEPTH)
      throw new Error(
        `Expect the finality branch length to be ${FINALIZED_ROOT_DEPTH}, but got ${finalityBranch.length}`
      );
    this.signatureSlot = Field.fromBigInt(BigInt(signatureSlot));
    this.attestedHeader = attestedHeader;
    this.nextSyncCommittee = nextSyncCommittee;
    this.nextSyncCommitteeBranch = nextSyncCommitteeBranch.map((node) =>
      Field.fromSSZ(node)
    );
    this.finalizedHeader = finalizedHeader;
    this.finalityBranch = finalityBranch.map((node) => Field.fromSSZ(node));
    this.syncCommitteeBits = VariableLengthField.fromSSZ(
      syncCommitteeBits,
      SYNC_COMMITTEE_SIZE / 8
    );

    this.syncCommitteeSignature = BLSSignature.fromSSZ(syncCommitteeSignature);
  }
  get object(): LightClientUpdateObject {
    return {
      signature_slot: this.signatureSlot.bigInt.toString(),
      next_sync_committee: this.nextSyncCommittee.object,
      next_sync_committee_branch: this.nextSyncCommitteeBranch.map(
        (e) => e.ssz
      ),
      attested_header: this.attestedHeader.object,
      finalized_header: this.finalizedHeader.object,
      finality_branch: this.finalityBranch.map((e) => e.ssz),
      sync_aggregate: {
        sync_committee_bits: this.syncCommitteeBits.ssz,
        sync_committee_signature: this.syncCommitteeSignature.ssz,
      },
    };
  }
  static fromObject(json: LightClientUpdateObject) {
    const signatureSlot = json.signature_slot;

    const attestedHeader = new LightClientHeader(json.attested_header);

    const finalizedHeader = new LightClientHeader(json.finalized_header);

    const finalityBranch = json.finality_branch;
    const syncCommitteeBits = json.sync_aggregate.sync_committee_bits;
    const syncCommitteeSignature = json.sync_aggregate.sync_committee_signature;
    const nextSyncCommittee = new SyncCommittee(json.next_sync_committee);
    const nextSyncCommitteeBranch = json.next_sync_committee_branch;

    return new LightClientUpdate(
      signatureSlot,
      attestedHeader,
      nextSyncCommittee,
      nextSyncCommitteeBranch,
      finalizedHeader,
      finalityBranch,
      syncCommitteeBits,
      syncCommitteeSignature
    );
  }

  isFinalityUpdate() {
    const zero = Field.zero();
    return !this.finalityBranch.every((node) => node.isEqual(zero));
  }
  isSyncCommitteeUpdate() {
    const zero = Field.zero();
    return !this.nextSyncCommitteeBranch.every((node) => node.isEqual(zero));
  }

  isValid(
    syncCommittee: SyncCommittee,
    genesisValidatorsRoot: Field
  ): IsLCUpdateValid {
    if (this.syncCommitteeBits.sumBits < MIN_SYNC_COMMITTEE_PARTICIPANTS)
      return {
        valid: false,
        msg: InvalidLCMessage.MIN_SYNC_COMMITTEE_PARTICIPANTS_NOT_MET,
      };
    if (!this.attestedHeader.isValid())
      return {
        valid: false,
        msg: InvalidLCMessage.INVALID_ATTESTED_HEADER,
      };
    if (this.signatureSlot.bigInt <= this.attestedHeader.beacon.slot.bigInt)
      return {
        valid: false,
        msg: InvalidLCMessage.SIGNATURE_SLOT_MUST_BE_AFTER_ATTESTED_SLOT,
      };
    if (
      this.attestedHeader.beacon.slot.bigInt <
      this.finalizedHeader.beacon.slot.bigInt
    )
      return {
        valid: false,
        msg: InvalidLCMessage.ATTESTED_SLOT_MUST_BE_AFTER_FINALIZED_SLOT,
      };
    if (!this._isFinalityUpdateValid())
      return {
        valid: false,
        msg: InvalidLCMessage.INVALID_FINALITY_UPDATE,
      };
    if (!this._isSyncCommitteeUpdateValid())
      return {
        valid: false,
        msg: InvalidLCMessage.INVALID_SYNC_COMMITTEE_UPDATE,
      };

    const signingRoot = this._computeSigningRoot(genesisValidatorsRoot);
    const aggregateKey = syncCommittee.getAggregateParticipantPubkeys(
      this.syncCommitteeBits
    );
    const validSignature =
      this.syncCommitteeSignature.chainsafeSignature.verify(
        aggregateKey,
        signingRoot.value
      );
    if (!validSignature)
      return {
        valid: false,
        msg: InvalidLCMessage.INVALID_AGGREGATE_SIGNATURE,
      };
    return { valid: true };
  }

  get summary(): LightClientUpdateSummary {
    return {
      activeParticipants: this.syncCommitteeBits.sumBits,
      attestedHeaderSlot: Number(this.attestedHeader.beacon.slot.bigInt),
      signatureSlot: Number(this.signatureSlot.bigInt),
      finalizedHeaderSlot: Number(this.finalizedHeader.beacon.slot.bigInt),
      isFinalityUpdate: this.isFinalityUpdate(),
      isSyncCommitteeUpdate: this.isSyncCommitteeUpdate(),
    };
  }
  private _isFinalityUpdateValid() {
    if (!this.isFinalityUpdate()) return this.finalizedHeader.beacon.isZeroed();

    if (!this.finalizedHeader.isValid()) return false;

    const expectedStateRoot = hashMerkleBranch(
      this.finalizedHeader.beacon.hashTreeRoot,
      this.finalityBranch,
      Field.fromBigInt(BigInt(FINALIZED_ROOT_INDEX))
    );
    if (!expectedStateRoot.isEqual(this.attestedHeader.beacon.stateRoot))
      return false;

    return true;
  }

  private _computeSigningRoot(genesisValidatorsRoot: Field) {
    const domain = computeDomain(
      Number(this.signatureSlot.bigInt) - 1,
      genesisValidatorsRoot
    );
    return hashTwo(this.attestedHeader.beacon.hashTreeRoot, domain);
  }
  private _isSyncCommitteeUpdateValid() {
    if (!this.isSyncCommitteeUpdate()) return true;

    const expectedStateRoot = hashMerkleBranch(
      this.nextSyncCommittee.hashTreeRoot,
      this.nextSyncCommitteeBranch,
      Field.fromBigInt(BigInt(NEXT_SYNC_COMMITTEE_INDEX))
    );
    if (!expectedStateRoot.isEqual(this.attestedHeader.beacon.stateRoot))
      return false;

    return true;
  }
  generateFinalityWitness() {
    const attestedBeacon = this.attestedHeader.beacon.flat;
    let emptyExecutionBranch = new Array(2 * EXECUTION_PAYLOAD_DEPTH);
    for (let i = 0; i < 2 * EXECUTION_PAYLOAD_DEPTH; i++)
      emptyExecutionBranch[i] = 0n;
    const finalizedBeacon = this.finalizedHeader.beacon.flat;
    const finalizedExecutionRoot = this.finalizedHeader.execution
      ? executionHashTreeRoot(this.finalizedHeader.execution).hilo
      : [0n, 0n];
    const finalizedExecutionBranch = this.finalizedHeader.executionBranch
      ? this.finalizedHeader.executionBranch.reduce(
          (list: BigInt[], node) => [...list, ...node.hilo],
          []
        )
      : emptyExecutionBranch;
    const finalityBranch = this.finalityBranch.reduce(
      (list: BigInt[], node) => [...list, ...node.hilo],
      []
    );
    const isFinalityUpdate = this.isFinalityUpdate();
    const inputs = [
      ...attestedBeacon,
      ...finalizedBeacon,
      ...finalizedExecutionRoot,
      ...finalizedExecutionBranch,
      ...finalityBranch,
      isFinalityUpdate,
    ];

    const witness = new Map<number, string>();
    inputs.forEach((input, index) => {
      witness.set(index + 1, convertToHexAndPad(input));
    });
    return witness;
  }

  generateNextSyncCommitteeWitness() {
    const attestedBeacon = this.attestedHeader.beacon.flat;
    const nextSyncCommitteeAllRoots = this.nextSyncCommittee.allRoots;
    const nextSyncCommitteePubkeysRoot =
      nextSyncCommitteeAllRoots.pubkeysRoot.hilo;
    const nextSyncCommitteeAggkey = this.nextSyncCommittee.aggregateKey.hilo;
    const nextSyncCommitteeBranch = this.nextSyncCommitteeBranch.reduce(
      (list: BigInt[], node) => [...list, ...node.hilo],
      []
    );
    const isSyncCommitteeUpdate = this.isSyncCommitteeUpdate();
    const inputs = [
      ...attestedBeacon,
      ...nextSyncCommitteePubkeysRoot,
      ...nextSyncCommitteeAggkey,
      ...nextSyncCommitteeBranch,
      isSyncCommitteeUpdate,
    ];

    const witness = new Map<number, string>();
    inputs.forEach((input, index) => {
      witness.set(index + 1, convertToHexAndPad(input));
    });
    return witness;
  }

  generateLCUpdateWitness(genesisValidatorsRoot: Field) {
    let emptyExecutionBranch = new Array(2 * EXECUTION_PAYLOAD_DEPTH);
    for (let i = 0; i < 2 * EXECUTION_PAYLOAD_DEPTH; i++)
      emptyExecutionBranch[i] = 0n;

    const signatureSlot = this.signatureSlot.bigInt;

    const attestedBeacon = this.attestedHeader.beacon.flat;
    const attestedExecutionRoot = this.attestedHeader.execution
      ? executionHashTreeRoot(this.attestedHeader.execution).hilo
      : [0n, 0n];
    const attestedExecutionBranch = this.attestedHeader.executionBranch
      ? this.attestedHeader.executionBranch.reduce(
          (list: BigInt[], node) => [...list, ...node.hilo],
          []
        )
      : emptyExecutionBranch;

    const syncCommitteeBits = this.syncCommitteeBits.chunks(16);

    const signingRoot = this._computeSigningRoot(genesisValidatorsRoot).hilo;
    const activeParticipants = this.syncCommitteeBits.sumBits;

    const inputs = [
      signatureSlot,
      ...attestedBeacon,
      ...attestedExecutionRoot,
      ...attestedExecutionBranch,
      ...syncCommitteeBits,
      ...signingRoot,
      activeParticipants,
    ];

    const witness = new Map<number, string>();
    inputs.forEach((input, index) => {
      witness.set(index + 1, convertToHexAndPad(input));
    });
    return witness;
  }

  async generateFinalityProof() {
    const witness = this.generateFinalityWitness();
    return await generateProof(witness, validateFinalityCircuit);
  }

  async generateNextSyncCommitteeProof() {
    const witness = this.generateNextSyncCommitteeWitness();
    return await generateProof(witness, validateNextSyncCommCircuit);
  }

  async generateLCUpdateProof(genesisValidatorsRoot: Field) {
    const witness = this.generateLCUpdateWitness(genesisValidatorsRoot);
    return await generateProof(witness, validateLCUpdateCircuit);
  }

  async validateLCUpdateContractData(genesisValidatorsRoot: Field) {
    const finalityProof = await this.generateFinalityProof();
    const nextSyncCommitteeProof = await this.generateNextSyncCommitteeProof();
    const lcUpdateProof = await this.generateLCUpdateProof(
      genesisValidatorsRoot
    );
    const nextPubkeys = this.nextSyncCommittee.pubKeys.map(
      (pubkey) => pubkey.contractData
    );

    return [
      finalityProof.slicedProof,
      finalityProof.publicInputs,
      nextSyncCommitteeProof.slicedProof,
      nextSyncCommitteeProof.publicInputs,
      lcUpdateProof.slicedProof,
      lcUpdateProof.publicInputs,
      nextPubkeys,
    ];
  }
}
