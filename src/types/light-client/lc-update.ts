import hashMerkleBranch from "../../hash/hash-merkle-brach.js";
import {
  FINALIZED_ROOT_DEPTH,
  FINALIZED_ROOT_INDEX,
  MIN_SYNC_COMMITTEE_PARTICIPANTS,
  NEXT_SYNC_COMMITTEE_DEPTH,
  NEXT_SYNC_COMMITTEE_INDEX,
  SYNC_COMMITTEE_SIZE,
} from "../../constants/index.js";
import BLSSignature from "../beacon/bls-signature.js";
import SyncCommittee from "../beacon/sync-committee.js";
import Field from "../primitives/field.js";
import VariableLengthField from "../primitives/variable-length-field.js";
import LightClientHeader from "./lc-header.js";
import { InvalidLCMessage, IsLCUpdateValid } from "../../index.js";
import computeDomain from "../../domain/compute-domain.js";
import hashTwo from "../../hash/hash-two.js";

export default class LightClientUpdate {
  private _signatureSlot: Field;
  private _attestedHeader: LightClientHeader;
  private _nextSyncCommittee: SyncCommittee;
  private _nextSyncCommitteeBranch: Array<Field>;
  private _finalizedHeader: LightClientHeader;
  private _finalityBranch: Array<Field>;
  private _syncCommitteeBits: VariableLengthField;
  private _syncCommitteeSignature: BLSSignature;

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
    this._signatureSlot = Field.fromBigInt(BigInt(signatureSlot));
    this._attestedHeader = attestedHeader;
    this._nextSyncCommittee = nextSyncCommittee;
    this._nextSyncCommitteeBranch = nextSyncCommitteeBranch.map((node) =>
      Field.fromSSZ(node)
    );
    this._finalizedHeader = finalizedHeader;
    this._finalityBranch = finalityBranch.map((node) => Field.fromSSZ(node));
    this._syncCommitteeBits = VariableLengthField.fromSSZ(
      syncCommitteeBits,
      SYNC_COMMITTEE_SIZE
    );
    this._syncCommitteeSignature = BLSSignature.fromSSZ(syncCommitteeSignature);
  }

  static fromJSON(json: any) {
    const signatureSlot = json.signature_slot;

    const attestedHeader = new LightClientHeader(
      json.attested_header.beacon,
      json.attested_header.execution,
      json.attested_header.execution_branch
    );

    const finalizedHeader = new LightClientHeader(
      json.finalized_header.beacon,
      json.finalized_header.execution,
      json.finalized_header.execution_branch
    );

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
    return !this._finalityBranch.every((node) => node.isEqual(zero));
  }
  isSyncCommitteeUpdate() {
    const zero = Field.zero();
    return !this._nextSyncCommitteeBranch.every((node) => node.isEqual(zero));
  }

  isValid(
    syncCommittee: SyncCommittee,
    genesisValidatorsRoot: Field
  ): IsLCUpdateValid {
    if (this._syncCommitteeBits.sumBits < MIN_SYNC_COMMITTEE_PARTICIPANTS)
      return {
        valid: false,
        msg: InvalidLCMessage.MIN_SYNC_COMMITTEE_PARTICIPANTS_NOT_MET,
      };
    if (!this._attestedHeader.isValid())
      return {
        valid: false,
        msg: InvalidLCMessage.INVALID_ATTESTED_HEADER,
      };
    if (this._signatureSlot.bigInt <= this._attestedHeader.beacon.slot.bigInt)
      return {
        valid: false,
        msg: InvalidLCMessage.SIGNATURE_SLOT_MUST_BE_AFTER_ATTESTED_SLOT,
      };
    if (
      this._attestedHeader.beacon.slot.bigInt <
      this._finalizedHeader.beacon.slot.bigInt
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
    const domain = computeDomain(
      Number(this._signatureSlot.bigInt) - 1,
      genesisValidatorsRoot
    );
    const signingRoot = hashTwo(
      this._attestedHeader.beacon.hashTreeRoot,
      domain
    );
    const aggregateKey = syncCommittee.getAggregateParticipantPubkeys(
      this._syncCommitteeBits
    );
    const validSignature =
      this._syncCommitteeSignature.chainsafeSignature.verify(
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

  private _isFinalityUpdateValid() {
    if (!this.isFinalityUpdate())
      return this._finalizedHeader.beacon.isZeroed();

    if (!this._finalizedHeader.isValid()) return false;

    const expectedStateRoot = hashMerkleBranch(
      this._finalizedHeader.beacon.hashTreeRoot,
      this._finalityBranch,
      Field.fromBigInt(BigInt(FINALIZED_ROOT_INDEX))
    );
    if (!expectedStateRoot.isEqual(this._attestedHeader.beacon.stateRoot))
      return false;

    return true;
  }

  private _isSyncCommitteeUpdateValid() {
    if (!this.isSyncCommitteeUpdate()) return true;

    const expectedStateRoot = hashMerkleBranch(
      this._nextSyncCommittee.hashTreeRoot,
      this._nextSyncCommitteeBranch,
      Field.fromBigInt(BigInt(NEXT_SYNC_COMMITTEE_INDEX))
    );
    if (!expectedStateRoot.isEqual(this._attestedHeader.beacon.stateRoot))
      return false;

    return true;
  }
}
