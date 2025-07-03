import type { ListingNFTPreview, ListingNFT, PurchasedListingNFT } from '../types/nftTypes';

const address1 = '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510';
const address2 = '0xFA7E7a79AC32fe399E9C28cBE1E286981A8F8510';

const mockListingNFTPreviewList: ListingNFTPreview[] = [
  {
    owner: address1,
    name: 'Mystic Forest',
    description: 'A beautiful digital painting of a mysterious forest at dawn.',
    image: 'ipfs://QmMysticForestImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 25.0 },
      { trait_type: 'ipfs_address', value: 'ipfs://QmMysticForestNFT' },
    ],
  },
  {
    owner: address1,
    name: 'Encrypted Whitepaper',
    description: 'Access the original whitepaper, securely encrypted as a zkDrop NFT.',
    image: 'ipfs://QmWhitepaperImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 15.0 },
      { trait_type: 'ipfs_address', value: 'ipfs://QmWhitepaperNFT' },
    ],
  },
  {
    owner: address2,
    name: 'Genesis Audio',
    description: 'The first audio NFT drop, featuring exclusive music content.',
    image: 'ipfs://QmGenesisAudioImage',
    attributes: [
      { trait_type: 'price_in_usd', value: 15.0 },
      { trait_type: 'ipfs_address', value: 'ipfs://QmGenesisAudioNFT' },
    ],
  },
];

// Mock NFT data (should be imported or moved to a shared file in real app)
const mockListingNFTList: Record<string, any> = {
  'ipfs://QmMysticForestNFT': {
    owner: address1,
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
    owner: address1,
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
    owner: address2,
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
};

const mockPurchasedListingNFTs: PurchasedListingNFT[] = [
  {
    proposer: address2,
    nft: mockListingNFTList['ipfs://QmMysticForestNFT'],
    purchaseState: 5, // PAID
  },
  {
    proposer: address2,
    nft: mockListingNFTList['ipfs://QmWhitepaperNFT'],
    purchaseState: 1, // ZK_PROOF_SUBMITTED
  },
  {
    proposer: address1,
    nft: mockListingNFTList['ipfs://QmGenesisAudioNFT'],
    purchaseState: 2, // VERIFIED
  },
];

export async function fetchListingNFTPreviews(): Promise<ListingNFTPreview[]> {
  // Simulate a network request with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockListingNFTPreviewList);
    }, 200); // 200ms delay
  });
}

export async function fetchListingNFTDetailsByIPFSAddress(
  ipfs_address: string
): Promise<ListingNFT> {
  // Simulate a network request with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockListingNFTList[ipfs_address]);
    }, 200); // 200ms delay
  });
}

export async function fetchListingNFTPreviewsByOwner(owner: string): Promise<ListingNFTPreview[]> {
  // Filter the mock data by owner
  const filteredNFTs = mockListingNFTPreviewList.filter(
    (nft) => nft.owner.toLowerCase() === owner.toLowerCase()
  );

  // Simulate a network request with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(filteredNFTs);
    }, 200); // 200ms delay
  });
}

export async function fetchPurchasedListingNFTPreviewsByProposer(
  proposer: string
): Promise<PurchasedListingNFT[]> {
  // For simplicity, we return the same mock data as for uploaded NFTs
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        mockPurchasedListingNFTs.filter(
          (nft) => nft.proposer.toLowerCase() === proposer.toLowerCase()
        )
      );
    }, 200); // 200ms delay
  });
}

export async function fetchPurchasedListingNFTPreviewsByOwner(
  owner: string
): Promise<PurchasedListingNFT[]> {
  // Filter the mock data by owner
  const filteredNFTs = mockPurchasedListingNFTs.filter(
    (nft) => nft.nft.owner.toLowerCase() === owner.toLowerCase()
  );

  // Simulate a network request with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(filteredNFTs);
    }, 200); // 200ms delay
  });
}
