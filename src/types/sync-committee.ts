import hashTreeRoot from "../hash/hash-tree-root.js";
import { SyncCommitteeObject } from "../index.js";
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
    const pubkeyRoots = this._pubKeys.map((pubkey) => pubkey.hashTreeRoot);
    const pubkeysRoot = hashTreeRoot(pubkeyRoots);
    return hashTreeRoot([pubkeysRoot, aggregateKeyRoot]);
  }
}
