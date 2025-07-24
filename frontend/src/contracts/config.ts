// Contract configuration for deployed contracts on Sepolia
// Generated from deployment on Sepolia testnet

export const CONTRACT_ADDRESSES = {
  /*  ESCROW: '0x6F6B098D0a203CdAE8DD237F248eC8c4c18CD076',
  DATASET_NFT: '0xe7C456BA154C2C515B25B80c8b95eC4f9702e239',
  ZK_VERIFIER: '0x86dDa2da1De07834b61B5C1D71dc8CdB1D70718f',*/
  ESCROW: '0x8cCA7b4c696Bf99c4B15465d262e78f063804615',
  DATASET_NFT: '0xb1385b9abaefC10A64e8De6532C0CfEb1c13f5F6',
  ZK_VERIFIER: '0x9a442b88b212D79f5927D07A43DA04e5070Fc42C',
};

export const NETWORK_CONFIG = {
  chainId: 11155111, // Sepolia
  name: 'sepolia',
  isLocalhost: false,
};

// Contract ABIs - importing from artifacts directory
// Note: The artifacts folder is at the root level, so we go up from frontend/src
import EscrowArtifact from '../../../artifacts/contracts/Escrow.sol/Escrow.json';
import DatasetNFTArtifact from '../../../artifacts/contracts/DatasetNFT.sol/DatasetNFT.json';
import ZKVerifierArtifact from '../../../artifacts/contracts/ZK-Verifier.sol/ZKVerifier.json';

export const ESCROW_ABI = EscrowArtifact.abi;
export const DATASET_NFT_ABI = DatasetNFTArtifact.abi;
export const ZK_VERIFIER_ABI = ZKVerifierArtifact.abi;
