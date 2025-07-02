import type { ListingNFTPreview, ListingNFT } from '../types/nftTypes';
const mockListingNFTPreviewList: ListingNFTPreview[] = [
  {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Mystic Forest',
    description: 'A beautiful digital painting of a mysterious forest at dawn.',
    image: 'ipfs://QmMysticForestImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 25.0 },
      { trait_type: 'ipfs_address', value: 'ipfs://QmMysticForestNFT' },
    ],
  },
  {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Encrypted Whitepaper',
    description: 'Access the original whitepaper, securely encrypted as a zkDrop NFT.',
    image: 'ipfs://QmWhitepaperImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 15.0 },
      { trait_type: 'ipfs_address', value: 'ipfs://QmWhitepaperNFT' },
    ],
  },
  {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Genesis Audio',
    description: 'The first audio NFT drop, featuring exclusive music content.',
    image: 'ipfs://QmGenesisAudioImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 15.0 },
      { trait_type: 'ipfs_address', value: 'ipfs://QmWhitepaperNFT' },
    ],
  },
  {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE282981A8F8510',
    name: 'Rare Collectible Card',
    description: 'A legendary digital collectible card with unique artwork.',
    image: 'ipfs://QmCollectibleCardImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 15.0 },
      { trait_type: 'ipfs_address', value: 'ipfs://QmWhitepaperNFT' },
    ],
  },
  {
    owner: '0xFA7E7a79AC32fe399E9C28cBE1E286981A8F8510',
    name: 'Zero-Knowledge Art',
    description: 'An abstract piece inspired by zero-knowledge cryptography.',
    image: 'ipfs://QmZKArtImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 15.0 },
      { trait_type: 'ipfs_address', value: 'ipfs://QmWhitepaperNFT' },
    ],
  },
  {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Mystic Forest',
    description: 'A beautiful digital painting of a mysterious forest at dawn.',
    image: 'ipfs://QmMysticForestImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 15.0 },
      { trait_type: 'ipfs_address', value: 'ipfs://QmWhitepaperNFT' },
    ],
  },
  {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Mystic Forest',
    description: 'A beautiful digital painting of a mysterious forest at dawn.',
    image: 'ipfs://QmMysticForestImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 15.0 },
      { trait_type: 'ipfs_address', value: 'ipfs://QmWhitepaperNFT' },
    ],
  },
  {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Mystic Forest',
    description: 'A beautiful digital painting of a mysterious forest at dawn.',
    image: 'ipfs://QmMysticForestImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 15.0 },
      { trait_type: 'ipfs_address', value: 'ipfs://QmWhitepaperNFT' },
    ],
  },
  {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Mystic Forest',
    description: 'A beautiful digital painting of a mysterious forest at dawn.',
    image: 'ipfs://QmMysticForestImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 15.0 },
      { trait_type: 'ipfs_address', value: 'ipfs://QmWhitepaperNFT' },
    ],
  },
  {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Mystic Forest',
    description: 'A beautiful digital painting of a mysterious forest at dawn.',
    image: 'ipfs://QmMysticForestImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 15.0 },
      { trait_type: 'ipfs_address', value: 'ipfs://QmWhitepaperNFT' },
    ],
  },
  {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Mystic Forest',
    description: 'A beautiful digital painting of a mysterious forest at dawn.',
    image: 'ipfs://QmMysticForestImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 15.0 },
      { trait_type: 'ipfs_address', value: 'ipfs://QmWhitepaperNFT' },
    ],
  },
  {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Mystic Forest',
    description: 'A beautiful digital painting of a mysterious forest at dawn.',
    image: 'ipfs://QmMysticForestImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 15.0 },
      { trait_type: 'ipfs_address', value: 'ipfs://QmWhitepaperNFT' },
    ],
  },
  {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Mystic Forest',
    description: 'A beautiful digital painting of a mysterious forest at dawn.',
    image: 'ipfs://QmMysticForestImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 15.0 },
      { trait_type: 'ipfs_address', value: 'ipfs://QmWhitepaperNFT' },
    ],
  },
];

// Mock NFT data (should be imported or moved to a shared file in real app)
const mockMintNFT: Record<string, any> = {
  'ipfs://QmMysticForestNFT': {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Mystic Forest',
    description: 'A beautiful digital painting of a mysterious forest at dawn.',
    image: 'ipfs://QmMysticForestImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 25.0 },
      { trait_type: 'file_enc', value: 'ipfs://link_to_enc_file' },
      { trait_type: 'file_type', value: '.jpg' },
      { trait_type: 'category', value: 'Art' },
    ],
  },
  'ipfs://QmWhitepaperNFT': {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Encrypted Whitepaper',
    description: 'Access the original whitepaper, securely encrypted as a zkDrop NFT.',
    image: 'ipfs://QmWhitepaperImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 15.0 },
      { trait_type: 'file_enc', value: 'ipfs://link_to_enc_file' },
      { trait_type: 'file_type', value: '.pdf' },
      { trait_type: 'category', value: 'Document' },
    ],
  },
  'ipfs://QmGenesisAudioNFT': {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Genesis Audio',
    description: 'The first audio NFT drop, featuring exclusive music content.',
    image: 'ipfs://QmGenesisAudioImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 30.0 },
      { trait_type: 'file_enc', value: 'ipfs://link_to_enc_file' },
      { trait_type: 'file_type', value: '.mp3' },
      { trait_type: 'category', value: 'Music' },
    ],
  },
  'ipfs://QmCollectibleCardNFT': {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE282981A8F8510',
    name: 'Rare Collectible Card',
    description: 'A legendary digital collectible card with unique artwork.',
    image: 'ipfs://QmCollectibleCardImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 50.0 },
      { trait_type: 'file_enc', value: 'ipfs://link_to_enc_file' },
      { trait_type: 'file_type', value: '.png' },
      { trait_type: 'category', value: 'Collectible' },
    ],
  },
  'ipfs://QmZKArtNFT': {
    owner: '0xFA7E7a79AC32fe399E9C28cBE1E286981A8F8510',
    name: 'Zero-Knowledge Art',
    description: 'An abstract piece inspired by zero-knowledge cryptography.',
    image: 'ipfs://QmZKArtImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 50.0 },
      { trait_type: 'file_enc', value: 'ipfs://link_to_enc_file' },
      { trait_type: 'file_type', value: '.png' },
      { trait_type: 'category', value: 'Collectible' },
    ],
  },
};

export async function fetchListingNFTs(): Promise<ListingNFTPreview[]> {
  // Simulate a network request with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockListingNFTPreviewList);
    }, 200); // 200ms delay
  });
}

export async function fetchMintNFT(ipfs_address: string): Promise<ListingNFT> {
  // Simulate a network request with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockMintNFT[ipfs_address]);
    }, 200); // 200ms delay
  });
}
