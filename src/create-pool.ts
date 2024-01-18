import * as dotenv from "dotenv";
import { ContractTransaction, ethers } from "ethers";
import allo from "../abi/Allo.json";
import readline from "readline";

dotenv.config();
const now = Math.floor(Date.now() / 1000);
const minutes = (n: number) => n * 60;

// ================= Config ==================

const initData = {
  useRegistryAnchor: true,
  metadataRequired: false,
  passportDecoder: "0x22ff293e14F1EC3A09B137e9e06084AFd63adDF9",
  superfluidHost: "0x22ff293e14F1EC3A09B137e9e06084AFd63adDF9",
  allocationSuperToken: "0xf2d68898557ccb2cf4c10c3ef2b034b2a69dad00",
  registrationStartTime: now + minutes(5), // in seconds, must be in future
  registrationEndTime: now + minutes(220), // in seconds, must be after registrationStartTime
  allocationStartTime: now + minutes(5), // in seconds, must be after registrationStartTime
  allocationEndTime: now + minutes(225), // in seconds, must be after allocationStartTime
  minPassportScore: 0,
  initialSuperAppBalance: "1000", // in wei
};

const poolData = {
  profileId:
    "0x98f780ec12a0835b78ec0ccd983bbb0b9a2a3d2e226489215d890876d0903968", // created using create-profile.ts
  strategy: "0xc944eE998b6793Fa7511605A0577e245B1EEBc5a", // created using deploy-strategy.ts
  token: "0xf2d68898557ccb2cf4c10c3ef2b034b2a69dad00", // pool token (match token)
  metadata: {
    protocol: 0, // 0 = NONE, 1 = IPFS
    pointer: "bafybeib2z...", // IPFS CID
  },
  managers: [],
};

// ================== /Config ==================

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  // Wait 10 blocks for re-org protection
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.RPC_URL as string,
  );

  const signer = new ethers.Wallet(
    process.env.SIGNER_PRIVATE_KEY as string,
    provider,
  );

  const alloContract = new ethers.Contract(
    process.env.ALLO_MAIN_ADDRESS as string,
    allo.abi,
    signer,
  );

  console.log("Creating pool with:");

  console.log("\tUseRegistryAnchor:", initData.useRegistryAnchor);
  console.log("\tMetadataRequired:", initData.metadataRequired);
  console.log("\tPassportDecoder:", initData.passportDecoder);
  console.log("\tSuperfluidHost:", initData.superfluidHost);
  console.log("\tAllocationSuperToken:", initData.allocationSuperToken);
  console.log("\tRegistrationStartTime:", initData.registrationStartTime);
  console.log("\tRegistrationEndTime:", initData.registrationEndTime);
  console.log("\tAllocationStartTime:", initData.allocationStartTime);
  console.log("\tAllocationEndTime:", initData.allocationEndTime);
  console.log("\tMinPassportScore:", initData.minPassportScore);
  console.log("\tInitialSuperAppBalance:", initData.initialSuperAppBalance);
  console.log("");
  console.log("\tProfile ID:", poolData.profileId);
  console.log("\tStrategy:", poolData.strategy);
  console.log("\tToken:", poolData.token);
  console.log("\tMetadata:", poolData.metadata);
  console.log("\tManagers:", poolData.managers);
  console.log("");

  rl.question(
    `Do you want to proceed with address ${signer.address}? (y/n): `,
    async (answer) => {
      if (answer.toLowerCase() === "y") {
        const encodedInitData = ethers.utils.defaultAbiCoder.encode(
          [
            "bool",
            "bool",
            "address",
            "address",
            "address",
            "uint64",
            "uint64",
            "uint64",
            "uint64",
            "uint256",
            "uint256",
          ],
          [
            initData.useRegistryAnchor,
            initData.metadataRequired,
            initData.passportDecoder,
            initData.superfluidHost,
            initData.allocationSuperToken,
            initData.registrationStartTime,
            initData.registrationEndTime,
            initData.allocationStartTime,
            initData.allocationEndTime,
            initData.minPassportScore,
            initData.initialSuperAppBalance,
          ],
        );

        console.log("Create Pool...");

        const staticCallResult =
          await alloContract.callStatic.createPoolWithCustomStrategy(
            poolData.profileId,
            poolData.strategy,
            encodedInitData,
            poolData.token,
            0,
            [poolData.metadata.protocol, poolData.metadata.pointer],
            poolData.managers,
            { value: 0 },
          );

        const createTx: ContractTransaction =
          await alloContract.createPoolWithCustomStrategy(
            poolData.profileId,
            poolData.strategy,
            encodedInitData,
            poolData.token,
            0,
            [poolData.metadata.protocol, poolData.metadata.pointer],
            poolData.managers,
            { value: 0 },
          );

        console.log(
          `\x1b[32mPool successfully created: ${staticCallResult.toString()}\x1b[0m`,
        );
        console.log("Waiting for confirmation...");

        await createTx.wait();

        console.log(
          `\x1b[32m✅ Pool successfully created with id: ${staticCallResult.toString()}\x1b[0m`,
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
