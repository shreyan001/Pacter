import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
dotenv.config();

const ZG_TESTNET_PRIVATE_KEY = process.env.ZG_TESTNET_PRIVATE_KEY;
const ZG_AGENT_NFT_CREATOR_PRIVATE_KEY = process.env.ZG_AGENT_NFT_CREATOR_PRIVATE_KEY;
const ZG_AGENT_NFT_ALICE_PRIVATE_KEY = process.env.ZG_AGENT_NFT_ALICE_PRIVATE_KEY;
const ZG_AGENT_NFT_BOB_PRIVATE_KEY = process.env.ZG_AGENT_NFT_BOB_PRIVATE_KEY;

const config: HardhatUserConfig = {
  paths: {
    artifacts: "build/artifacts",
    cache: "build/cache",
    sources: "contracts",
    deploy: "scripts/deploy",
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      allowBlocksWithSameTimestamp: true,
      blockGasLimit: 100000000,
      gas: 100000000,
      accounts: [
        {
          privateKey: ZG_AGENT_NFT_CREATOR_PRIVATE_KEY || "0x1000000000000000000000000000000000000000000000000000000000000001",
          balance: "1000000000000000000000",
        },
        {
          privateKey: ZG_AGENT_NFT_ALICE_PRIVATE_KEY || "0x2000000000000000000000000000000000000000000000000000000000000002",
          balance: "1000000000000000000000",
        },
        {
          privateKey: ZG_AGENT_NFT_BOB_PRIVATE_KEY || "0x3000000000000000000000000000000000000000000000000000000000000003",
          balance: "1000000000000000000000",
        }
      ],
    },
    zgTestnet: {
      url: "https://evmrpc-testnet.0g.ai",
      accounts: [ZG_TESTNET_PRIVATE_KEY || "0x1000000000000000000000000000000000000000000000000000000000000001"],
      chainId: 16602,
      live: true,
      saveDeployments: true,
      tags: ["staging"]
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  namedAccounts: {
    deployer: {
      default: 0,
      hardhat: 0,
      zgTestnet: 0,
    },
    creator: {
      default: 0,
      hardhat: 0,
      zgTestnet: 0,
    },
    alice: {
      default: 1,
      hardhat: 1,
    },
    bob: {
      default: 2,
      hardhat: 2,
    },
  },
  external: {
    contracts: [
      {
        artifacts: "build/artifacts",
      },
    ],
    deployments: {
      hardhat: ["deployments/hardhat"],
      zgTestnet: ["deployments/zgTestnet"],
    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  }
};

export default config;