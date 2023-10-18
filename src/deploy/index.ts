import dotenv from "dotenv";
import { ethers } from "ethers";
import finalityArtifact from "../../artifacts/contracts/noir-verifiers/validate_finality/plonk_vk.sol/UltraVerifier.json" assert { type: "json" };
import nextSyncCommArtifact from "../../artifacts/contracts/noir-verifiers/validate_next_sync_committee/plonk_vk.sol/UltraVerifier.json" assert { type: "json" };
import lcUpdateArtifact from "../../artifacts/contracts/noir-verifiers/validate_lc_update/plonk_vk.sol/UltraVerifier.json" assert { type: "json" };
import lcValidatorArtifact from "../../artifacts/contracts/LightClientValidator.sol/LightClientValidator.json" assert { type: "json" };
import lcStorageArtifact from "../../artifacts/contracts/LightClientStore.sol/LightClientStore.json" assert { type: "json" };
import { SyncCommittee } from "../index.js";
import { readFileSync, writeFileSync } from "fs";
dotenv.config();

async function main() {
  const bootstrapFile = "bootstrap-state.json";

  const bootstrapState = JSON.parse(readFileSync(bootstrapFile, "utf-8"));
  const currentSyncCommittee = new SyncCommittee(
    bootstrapState.data.current_sync_committee
  );
  const boostrapSyncCommitteeRoot = currentSyncCommittee.hashTreeRoot.ssz;
  const boostrapHeader = Object.values(bootstrapState.data.latest_block_header);

  const rpcURL = process.env.RPC_UPL;
  const privateKey = process.env.PRIVATE_KEY;

  const provider = ethers.getDefaultProvider(rpcURL!);
  const wallet = new ethers.Wallet(privateKey!, provider);

  const FinalityVerifier = new ethers.ContractFactory(
    finalityArtifact.abi,
    finalityArtifact.bytecode,
    wallet
  );
  const finalityVerifier = await FinalityVerifier.deploy();

  console.log(`finalityVerifier deployed at ${finalityVerifier.target}`);

  const NextSyncCommVerifier = new ethers.ContractFactory(
    nextSyncCommArtifact.abi,
    nextSyncCommArtifact.bytecode,
    wallet
  );
  const nextSyncCommVerifier = await NextSyncCommVerifier.deploy();

  console.log(
    `nextSyncCommVerifier deployed at ${nextSyncCommVerifier.target}`
  );

  const LCUpdateVerifier = new ethers.ContractFactory(
    lcUpdateArtifact.abi,
    lcUpdateArtifact.bytecode,
    wallet
  );
  const lcUpdateVerifier = await LCUpdateVerifier.deploy();

  console.log(`lcUpdateVerifier deployed at ${lcUpdateVerifier.target}`);

  const LightClientValidator = new ethers.ContractFactory(
    lcValidatorArtifact.abi,
    lcValidatorArtifact.bytecode,
    wallet
  );

  const lcValidator = await LightClientValidator.deploy(
    finalityVerifier.target,
    nextSyncCommVerifier.target,
    lcUpdateVerifier.target
  );

  console.log(`lcValidator deployed at ${lcValidator.target}`);

  const LightClientStorage = new ethers.ContractFactory(
    lcStorageArtifact.abi,
    lcStorageArtifact.bytecode,
    wallet
  );

  const lcStorageContract = await LightClientStorage.deploy(
    lcValidator.target,
    boostrapHeader,
    boostrapSyncCommitteeRoot
  );

  console.log(`lcStorageContract deployed at ${lcStorageContract.target}`);

  const addresses = {
    finalityVerifier: finalityVerifier.target,
    nextSyncCommVerifier: nextSyncCommVerifier.target,
    lcUpdateVerifier: lcUpdateVerifier.target,
    lcValidator: lcValidator.target,
    lcStorageContract: lcStorageContract.target,
  };

  writeFileSync("addresses.json", JSON.stringify(addresses));
}

main().catch((err) => console.error(err));
