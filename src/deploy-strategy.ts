import { ethers } from "ethers";
import strategyData from "../abi/SQFSuperfluidStrategy.json";
import readline from "readline";

import dotenv from "dotenv";
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  // Wait 10 blocks for re-org protection
  const blocksToWait = 2;

  const provider = new ethers.providers.JsonRpcProvider(
    process.env.RPC_URL as string,
  );

  const signer = new ethers.Wallet(
    process.env.SIGNER_PRIVATE_KEY as string,
    provider,
  );

  rl.question(
    `Do you want to proceed with address ${signer.address}? (y/n): `,
    async (answer) => {
      if (answer.toLowerCase() === "y") {
        const strategyContractFactory = new ethers.ContractFactory(
          ["constructor(address,string)"],
          strategyData.bytecode,
          signer,
        );

        console.log("Deploying Strategy...");

        const contract = await strategyContractFactory.deploy(
          process.env.ALLO_MAIN_ADDRESS as string,
          "SQFSuperfluidv1",
        );

        console.log(`\x1b[32mDeployed Strategy to ${contract.address}\x1b[0m`);
        console.log("Waiting for confirmation...");

        await contract.deployTransaction.wait(blocksToWait);

        console.log("✅ Deployed.");
        console.log(
          `\x1b[90mLog: ${contract.address} ${
            process.env.ALLO_MAIN_ADDRESS as string
          } ${"SQFSuperfluidv1"}\x1b[0m`,
        );
      } else {
        console.log("Exiting script. No further action taken.");
      }

      rl.close();
    },
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
