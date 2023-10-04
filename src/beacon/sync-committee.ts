import bls from "@chainsafe/bls";
import hashTreeRoot from "../hash/hash-tree-root.js";
import { SyncCommitteeObject } from "../index.js";
import VariableLengthField from "../primitives/variable-length-field.js";
import BLSPubKey from "./bls-pubkey.js";

export default class SyncCommittee {
  private _pubKeys: Array<BLSPubKey>;
  private _aggregateKey: BLSPubKey;

  constructor({ pubkeys, aggregate_pubkey }: SyncCommitteeObject) {
    this._pubKeys = pubkeys.map((pubkey) => BLSPubKey.fromSSZ(pubkey));
    this._aggregateKey = BLSPubKey.fromSSZ(aggregate_pubkey);
  }

  get pubKeys() {
    return this._pubKeys;
  }

  get aggregateKey() {
    return this._aggregateKey;
  }

  get hashTreeRoot() {
    const aggregateKeyRoot = this._aggregateKey.hashTreeRoot;
    const pubkeysRoot = this.pubkeysRoot;
    return hashTreeRoot([pubkeysRoot, aggregateKeyRoot]);
  }

  get pubkeysRoot() {
    const pubkeyRoots = this._pubKeys.map((pubkey) => pubkey.hashTreeRoot);
    return hashTreeRoot(pubkeyRoots);
  }

  get allRoots() {
    const aggregateKeyRoot = this._aggregateKey.hashTreeRoot;
    const pubkeysRoot = this.pubkeysRoot;

    return {
      aggregateKeyRoot,
      pubkeysRoot,
      hashTreeRoot: hashTreeRoot([pubkeysRoot, aggregateKeyRoot]),
    };
  }

  getParticipantPubkeys(syncCommitteeBits: VariableLengthField) {
    const bits = syncCommitteeBits.leBits;
    let result = [];
    for (let i = 0; i < bits.length; i++) {
      if (bits[i]) {
        result.push(this.pubKeys[i]);
      }
    }
    return result;
  }

  getAggregateParticipantPubkeys(syncCommitteeBits: VariableLengthField) {
    const participantKeys = this.getParticipantPubkeys(syncCommitteeBits).map(
      (key) => key.chainsafePubkey
    );
    return bls.PublicKey.aggregate(participantKeys);
  }
}
