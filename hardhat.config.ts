import type { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const config: HardhatUserConfig = {
  solidity: '0.8.28',
  paths: {
    sources: './contracts',
    tests: './tests',
    cache: './cache',
    artifacts: './artifacts',
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
    },
  },
  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v6',
  },
};

export default config;
