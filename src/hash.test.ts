import hashTwo from "./hash/hash-two.js";
import Field from "./primitives/field.js";
import hashTwoCircuit from "../circuits/tests/hash_two/target/hash_two.json" assert { type: "json" };
import sha256Circuit from "../circuits/tests/sha256/target/sha256.json" assert { type: "json" };
import hashTreeRootCircuit from "../circuits/tests/hash_tree_root/target/hash_tree_root.json" assert { type: "json" };
import merkleBranchCircuit from "../circuits/tests/merkle_branch/target/merkle_branch.json" assert { type: "json" };
import {
  convertToHexAndPad,
  leBytesToUint8Array,
} from "./converter/numeric.js";
import { validateWitness } from "./berretenberg-api/index.js";
import { expect } from "chai";
import { sha256 } from "js-sha256";
import hashTreeRoot from "./hash/hash-tree-root.js";
import hashMerkleBranch from "./hash/hash-merkle-brach.js";
import artifact from "../artifacts/contracts/LightClientValidator.sol/LightClientValidator.json" assert { type: "json" };
import { ethers } from "ethers";

describe("test hash functions", () => {
  let contract: any;

  before("deploy the target contract", async () => {
    const provider = ethers.getDefaultProvider("http://127.0.0.1:8545");
    const wallet = new ethers.Wallet(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
      provider
    );
    const Factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      wallet
    );
    contract = await Factory.deploy();
  });

  it("test sha256", async () => {
    let leBytes = new Array(32);
    for (let i = 0; i < 32; i++) {
      leBytes[i] = BigInt(5 * i + 11);
    }

    let uint8Array = leBytesToUint8Array(leBytes);
    let hash = sha256.create();
    hash.update(uint8Array);
    let res = hash.digest();
    let inputs = [...leBytes, ...res];
    const witness = new Map<number, string>();
    inputs.forEach((input, index) => {
      witness.set(index + 1, convertToHexAndPad(input));
    });
    const verified = await validateWitness(witness, sha256Circuit);
    expect(verified).to.be.true;
  });
  it("test hashTwo function", async () => {
    let x = Field.fromBigInt(BigInt("943981741707232874"));
    let y = Field.fromBigInt(BigInt("347109843729721111"));
    let hash = hashTwo(x, y);

    let xHiLo = x.hilo;
    let yHilo = y.hilo;
    let hashHilo = hash.hilo;

    let inputs = [...xHiLo, ...yHilo, ...hashHilo];
    const witness = new Map<number, string>();
    inputs.forEach((input, index) => {
      witness.set(index + 1, convertToHexAndPad(input));
    });
    const verified = await validateWitness(witness, hashTwoCircuit);
    expect(verified).to.be.true;

    const expectedHash = await contract.hashTwo(x.value, y.value);
    expect(expectedHash).to.be.equal(hash.ssz);
  });
  it("test hashTreeRoot function", async () => {
    let x0 = Field.fromBigInt(BigInt("943981741707232874"));
    let x1 = Field.fromBigInt(BigInt("943981741707232875"));
    let x2 = Field.fromBigInt(BigInt("943981741707232876"));
    let x3 = Field.fromBigInt(BigInt("943981741707232877"));
    let x4 = Field.fromBigInt(BigInt("943981741707232878"));
    let leaves = [x0, x1, x2, x3, x4];
    let treeRoot = hashTreeRoot(leaves);

    let treeRootHiLo = treeRoot.hilo;
    let inputs = [
      ...leaves.reduce((acc: BigInt[], leaf) => [...acc, ...leaf.hilo], []),
      0n,
      0n,
      0n,
      0n,
      0n,
      0n,
      ...treeRootHiLo,
    ];
    const witness = new Map<number, string>();
    inputs.forEach((input, index) => {
      witness.set(index + 1, convertToHexAndPad(input));
    });
    const verified = await validateWitness(witness, hashTreeRootCircuit);
    expect(verified).to.be.true;
  });
  it("test hash merkle branch", async () => {
    let leaf = Field.fromBigInt(BigInt("849314791791"));
    let x = BigInt("483989411114343");
    let branch = new Array<Field>(8);
    for (let i = 0; i < 8; i++) {
      branch[i] = Field.fromBigInt(x + BigInt(i));
    }
    let index = Field.fromBigInt(BigInt(134));
    let root = hashMerkleBranch(leaf, branch, index);

    let inputs = [
      ...root.hilo,
      ...leaf.hilo,
      index.bigInt,
      ...branch.reduce((acc: BigInt[], leaf) => [...acc, ...leaf.hilo], []),
    ];
    const witness = new Map<number, string>();
    inputs.forEach((input, index) => {
      witness.set(index + 1, convertToHexAndPad(input));
    });
    const verified = await validateWitness(witness, merkleBranchCircuit);
    expect(verified).to.be.true;
  });
});
