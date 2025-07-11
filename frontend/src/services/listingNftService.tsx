import type { ListingNFTPreview, ListingNFT, PurchasedListingNFT } from '../types/nftTypes';
import { smartContractService } from './smartContractService';

// Configuration - set to true to use smart contracts, false for mock data
const USE_SMART_CONTRACTS = true;

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
    purchaseState: 5,
  },
  {
    proposer: address2,
    nft: mockListingNFTList['ipfs://QmWhitepaperNFT'],
    purchaseState: 1,
  },
  {
    proposer: address1,
    nft: mockListingNFTList['ipfs://QmGenesisAudioNFT'],
    purchaseState: 2,
  },
];

// Updated functions that can use either smart contracts or mock data
export async function fetchListingNFTPreviews(): Promise<ListingNFTPreview[]> {
  if (USE_SMART_CONTRACTS) {
    try {
      console.log('🔗 Fetching listing NFTs from smart contract...');
      const nfts = await smartContractService.fetchAllActiveListingNFTs();
      console.log('✅ Fetched from smart contract:', nfts.length, 'NFTs');
      return nfts;
    } catch (error) {
      console.error('❌ Failed to fetch from smart contract, falling back to mock data:', error);
      return mockListingNFTPreviewList;
    }
  } else {
    // Mock data with delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockListingNFTPreviewList);
      }, 200);
    });
  }
}

export async function fetchListingNFTDetailsByIPFSAddress(
  ipfs_address: string
): Promise<ListingNFT> {
  if (USE_SMART_CONTRACTS) {
    try {
      console.log('🔗 Fetching NFT details from smart contract for:', ipfs_address);

      // For smart contract data, we need to find the NFT by metadata
      // This is a simplified approach - in production you might want to index this better
      const allNFTs = await smartContractService.fetchAllActiveListingNFTs();

      const nft = allNFTs.find((nft) => {
        const ipfsAttr = nft.attributes.find((attr) => attr.trait_type === 'ipfs_address');
        return ipfsAttr?.value === ipfs_address;
      });

      if (!nft) {
        throw new Error('NFT not found');
      }

      console.log('✅ Found NFT details from smart contract');
      return nft as ListingNFT;
    } catch (error) {
      console.error('❌ Failed to fetch NFT details from smart contract:', error);
      // Fall back to mock data
      return mockListingNFTList[ipfs_address];
    }
  } else {
    // Mock data with delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockListingNFTList[ipfs_address]);
      }, 200);
    });
  }
}

export async function fetchListingNFTPreviewsByOwner(owner: string): Promise<ListingNFTPreview[]> {
  if (USE_SMART_CONTRACTS) {
    try {
      console.log('🔗 Fetching listing NFTs by owner from smart contract:', owner);
      const nfts = await smartContractService.fetchListingNFTsByOwner(owner);
      console.log('✅ Fetched from smart contract:', nfts.length, 'NFTs for owner');
      return nfts;
    } catch (error) {
      console.error('❌ Failed to fetch from smart contract, falling back to mock data:', error);
      // Fall back to mock data
      const filteredNFTs = mockListingNFTPreviewList.filter(
        (nft) => nft.owner.toLowerCase() === owner.toLowerCase()
      );
      return filteredNFTs;
    }
  } else {
    // Mock data with delay
    const filteredNFTs = mockListingNFTPreviewList.filter(
      (nft) => nft.owner.toLowerCase() === owner.toLowerCase()
    );

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(filteredNFTs);
      }, 200);
    });
  }
}

export async function fetchPurchasedListingNFTPreviewsByProposer(
  proposer: string
): Promise<PurchasedListingNFT[]> {
  if (USE_SMART_CONTRACTS) {
    try {
      console.log('🔗 Fetching purchases by proposer from smart contract:', proposer);
      const purchases = await smartContractService.fetchPurchasesByBuyer(proposer);
      console.log('✅ Fetched from smart contract:', purchases.length, 'purchases by proposer');
      return purchases;
    } catch (error) {
      console.error(
        '❌ Failed to fetch purchases from smart contract, falling back to mock data:',
        error
      );
      // Fall back to mock data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(
            mockPurchasedListingNFTs.filter(
              (nft) => nft.proposer.toLowerCase() === proposer.toLowerCase()
            )
          );
        }, 200);
      });
    }
  } else {
    // Mock data with delay
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(
          mockPurchasedListingNFTs.filter(
            (nft) => nft.proposer.toLowerCase() === proposer.toLowerCase()
          )
        );
      }, 200);
    });
  }
}

export async function fetchPurchasedListingNFTPreviewsByOwner(
  owner: string
): Promise<PurchasedListingNFT[]> {
  if (USE_SMART_CONTRACTS) {
    try {
      console.log('🔗 Fetching purchases by owner from smart contract:', owner);
      const purchases = await smartContractService.fetchPurchasesBySeller(owner);
      console.log('✅ Fetched from smart contract:', purchases.length, 'purchases by owner');
      return purchases;
    } catch (error) {
      console.error(
        '❌ Failed to fetch purchases from smart contract, falling back to mock data:',
        error
      );
      // Fall back to mock data
      const filteredNFTs = mockPurchasedListingNFTs.filter(
        (nft) => nft.nft.owner.toLowerCase() === owner.toLowerCase()
      );
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(filteredNFTs);
        }, 200);
      });
    }
  } else {
    // Mock data with delay
    const filteredNFTs = mockPurchasedListingNFTs.filter(
      (nft) => nft.nft.owner.toLowerCase() === owner.toLowerCase()
    );

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(filteredNFTs);
      }, 200);
    });
  }
}
