import dotenv from "dotenv";
import { ethers } from "ethers";
import lcStorageArtifact from "../../artifacts/contracts/LightClientStore.sol/LightClientStore.json" assert { type: "json" };
import { SyncCommittee } from "../index.js";
import { readFileSync, writeFileSync } from "fs";
dotenv.config();

async function main() {
  const bootstrapFile = "bootstrap-state.json";
  const addressFile = "addresses.json";

  const bootstrapState = JSON.parse(readFileSync(bootstrapFile, "utf-8"));
  let addresses = JSON.parse(readFileSync(addressFile, "utf-8"));
  const currentSyncCommittee = new SyncCommittee(
    bootstrapState.data.current_sync_committee
  );
  const boostrapSyncCommitteeRoot = currentSyncCommittee.hashTreeRoot.ssz;
  const boostrapHeader = Object.values(bootstrapState.data.latest_block_header);

  const rpcURL = process.env.RPC_UPL;
  const privateKey = process.env.PRIVATE_KEY;

  const provider = ethers.getDefaultProvider(rpcURL!);
  const wallet = new ethers.Wallet(privateKey!, provider);

  const LightClientStorage = new ethers.ContractFactory(
    lcStorageArtifact.abi,
    lcStorageArtifact.bytecode,
    wallet
  );

  const lcStorageContract = await LightClientStorage.deploy(
    addresses.lcValidator,
    boostrapHeader,
    boostrapSyncCommitteeRoot
  );

  console.log(`lcStorageContract deployed at ${lcStorageContract.target}`);

  addresses.lcStorageContract = lcStorageContract.target;

  writeFileSync("addresses.json", JSON.stringify(addresses));
}

main().catch((err) => console.error(err));
