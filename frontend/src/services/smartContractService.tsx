import { ethers, BrowserProvider, Contract, parseEther, formatEther } from 'ethers';
import type { ListingNFTPreview, ListingNFT } from '../types/nftTypes';
import type { PurchasedListingNFT } from '../types/nftTypes';

// Import deployed contract configuration
import {
  CONTRACT_ADDRESSES,
  NETWORK_CONFIG,
  ESCROW_ABI,
  DATASET_NFT_ABI,
  ZK_VERIFIER_ABI,
} from '../contracts/config';

// Constants matching contract enums
export const PurchaseState = {
  PAID: 0,
  ZK_PROOF_SUBMITTED: 1,
  VERIFIED: 2,
  DELIVERED: 3,
  COMPLETED: 4,
  DISPUTED: 5,
  REFUNDED: 6,
  CANCELLED: 7,
} as const;

export const NFTType = {
  LISTING: 0,
  DATASET: 1,
} as const;

// Type definitions for better TypeScript support
export type PurchaseStateType = (typeof PurchaseState)[keyof typeof PurchaseState];
export type NFTTypeType = (typeof NFTType)[keyof typeof NFTType];

export class SmartContractService {
  private provider: BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private escrowContract: Contract | null = null;
  private datasetNFTContract: Contract | null = null;
  private zkVerifierContract: Contract | null = null;

  // Initialize the service with wallet connection
  async initialize(): Promise<boolean> {
    try {
      if (typeof window.ethereum !== 'undefined') {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        this.provider = new BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();

        // Verify we're on the correct network
        const network = await this.provider.getNetwork();
        const expectedChainId = NETWORK_CONFIG.chainId;

        if (Number(network.chainId) !== expectedChainId) {
          console.warn(
            `Warning: Connected to chain ${network.chainId}, expected ${expectedChainId}`
          );
          // You might want to prompt user to switch networks here
        }

        // Initialize contracts with deployed addresses
        this.escrowContract = new Contract(CONTRACT_ADDRESSES.ESCROW, ESCROW_ABI, this.signer);

        this.datasetNFTContract = new Contract(
          CONTRACT_ADDRESSES.DATASET_NFT,
          DATASET_NFT_ABI,
          this.signer
        );

        this.zkVerifierContract = new Contract(
          CONTRACT_ADDRESSES.ZK_VERIFIER,
          ZK_VERIFIER_ABI,
          this.signer
        );

        console.log('✅ Smart contract service initialized successfully');
        console.log('📋 Contract addresses:', CONTRACT_ADDRESSES);
        console.log('🌐 Network:', NETWORK_CONFIG);

        return true;
      } else {
        throw new Error('MetaMask not found');
      }
    } catch (error) {
      console.error('❌ Failed to initialize smart contract service:', error);
      return false;
    }
  }

  // Get current connected account
  async getCurrentAccount(): Promise<string | null> {
    try {
      if (!this.signer) {
        const initialized = await this.initialize();
        if (!initialized) return null;
      }
      return (await this.signer?.getAddress()) || null;
    } catch (error) {
      console.error('Failed to get current account:', error);
      return null;
    }
  }

  // Helper method to ensure contracts are initialized
  private ensureInitialized(): void {
    if (!this.escrowContract || !this.datasetNFTContract || !this.zkVerifierContract) {
      throw new Error('Contracts not initialized. Call initialize() first.');
    }
  }

  // ===================
  // NFT FETCHING METHODS
  // ===================

  // Get all listing NFTs for a specific owner (optimized version)
  async fetchListingNFTsByOwner(owner: string): Promise<ListingNFTPreview[]> {
    try {
      this.ensureInitialized();

      const nfts: ListingNFTPreview[] = [];

      console.log('🔍 Fetching listing NFTs for owner:', owner);

      // Use a more efficient approach - check consecutive tokens and stop after gaps
      const startTokenId = 1000000;
      let consecutiveFailures = 0;
      const maxConsecutiveFailures = 5; // Stop after 5 consecutive non-existent tokens
      let currentTokenId = startTokenId;

      while (consecutiveFailures < maxConsecutiveFailures && currentTokenId < startTokenId + 50) {
        try {
          // Check if this token exists and get its owner
          const tokenOwner = await this.datasetNFTContract!.ownerOf(currentTokenId);

          // Reset failure counter since we found a token
          consecutiveFailures = 0;

          if (tokenOwner.toLowerCase() === owner.toLowerCase()) {
            // Get NFT info to verify it's a listing NFT
            const nftInfo = await this.getNFTInfo(currentTokenId);

            if (nftInfo && nftInfo.nftType === NFTType.LISTING && nftInfo.isActive) {
              // Get metadata URI
              const metadataURI = await this.getTokenURI(currentTokenId);

              if (metadataURI) {
                // Fetch metadata from IPFS with timeout
                const nftData = await this.fetchNFTMetadataWithTimeout(metadataURI, 5000);

                if (nftData) {
                  nfts.push({
                    ...nftData,
                    owner: tokenOwner,
                    tokenId: currentTokenId,
                  } as ListingNFTPreview);
                }
              }
            }
          }
        } catch {
          // Token doesn't exist, increment failure counter
          consecutiveFailures++;
          // Don't log every single failure to reduce console spam
          if (consecutiveFailures === 1) {
            console.log(`🔍 Checking tokens starting from ${currentTokenId}...`);
          }
        }

        currentTokenId++;
      }

      console.log(`✅ Found ${nfts.length} listing NFTs for owner ${owner}`);
      return nfts;
    } catch (error) {
      console.error('Failed to fetch listing NFTs by owner:', error);
      return [];
    }
  }

  // Get all active listing NFTs (optimized version)
  async fetchAllActiveListingNFTs(): Promise<ListingNFTPreview[]> {
    try {
      this.ensureInitialized();

      const nfts: ListingNFTPreview[] = [];

      console.log('🔍 Fetching all active listing NFTs...');

      // Use a more efficient approach - check consecutive tokens and stop after gaps
      const startTokenId = 1000000;
      let consecutiveFailures = 0;
      const maxConsecutiveFailures = 5; // Stop after 5 consecutive non-existent tokens
      let currentTokenId = startTokenId;

      while (consecutiveFailures < maxConsecutiveFailures && currentTokenId < startTokenId + 50) {
        try {
          // Check if this token exists
          const tokenOwner = await this.datasetNFTContract!.ownerOf(currentTokenId);

          // Reset failure counter since we found a token
          consecutiveFailures = 0;

          // Get NFT info to verify it's an active listing NFT
          const nftInfo = await this.getNFTInfo(currentTokenId);

          if (nftInfo && nftInfo.nftType === NFTType.LISTING && nftInfo.isActive) {
            // Get metadata URI
            const metadataURI = await this.getTokenURI(currentTokenId);

            if (metadataURI) {
              // Fetch metadata from IPFS with timeout
              const nftData = await this.fetchNFTMetadataWithTimeout(metadataURI, 5000);

              if (nftData) {
                nfts.push({
                  ...nftData,
                  owner: tokenOwner,
                  tokenId: currentTokenId,
                } as ListingNFTPreview);
              }
            }
          }
        } catch {
          // Token doesn't exist, increment failure counter
          consecutiveFailures++;
          // Only log progress occasionally to reduce spam
          if (consecutiveFailures === 1) {
            console.log(`🔍 Scanning tokens from ${currentTokenId}...`);
          }
        }

        currentTokenId++;
      }

      console.log(`✅ Found ${nfts.length} active listing NFTs`);
      return nfts;
    } catch (error) {
      console.error('Failed to fetch all active listing NFTs:', error);
      return [];
    }
  }

  // Helper method to fetch NFT metadata from IPFS
  private async fetchNFTMetadata(metadataURI: string): Promise<Partial<ListingNFTPreview> | null> {
    try {
      // Convert IPFS URI to HTTP URL
      //const ipfsUrl = metadataURI.replace('ipfs://', 'https://ipfs.io/ipfs/');

      const ipfsUrl = metadataURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');

      const response = await fetch(ipfsUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }

      const metadata = await response.json();

      return {
        name: metadata.name || 'Unknown',
        description: metadata.description || '',
        image: metadata.image || '',
        attributes: metadata.attributes || [],
      };
    } catch (error) {
      console.error('Failed to fetch NFT metadata from IPFS:', error);
      return null;
    }
  }

  // Helper method to fetch NFT metadata from IPFS with timeout
  private async fetchNFTMetadataWithTimeout(
    metadataURI: string,
    timeoutMs: number = 5000
  ): Promise<Partial<ListingNFTPreview> | null> {
    try {
      // Convert IPFS URI to HTTP URL
      //const ipfsUrl = metadataURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      const ipfsUrl = metadataURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');

      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('IPFS fetch timeout')), timeoutMs);
      });

      // Race the fetch against the timeout
      const response = await Promise.race([fetch(ipfsUrl), timeoutPromise]);

      if (!response.ok) {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }

      const metadata = await response.json();

      return {
        name: metadata.name || 'Unknown',
        description: metadata.description || '',
        image: metadata.image || '',
        attributes: metadata.attributes || [],
      };
    } catch (error) {
      console.warn(`Failed to fetch NFT metadata from IPFS: ${error}`);
      return null;
    }
  }

  // Enhanced method to get the latest minted token ID (to optimize scanning)
  async getLatestTokenId(): Promise<number> {
    try {
      this.ensureInitialized();

      // Try to get the latest token by checking recent events
      // This is a simple approach - in production you might want to use event filters
      const startTokenId = 1000000;
      let latestFound = startTokenId - 1;

      // Check the last 20 potential tokens to find the highest existing one
      for (let i = 0; i < 20; i++) {
        try {
          await this.datasetNFTContract!.ownerOf(startTokenId + i);
          latestFound = startTokenId + i;
        } catch {
          // Token doesn't exist, continue
          continue;
        }
      }

      return latestFound;
    } catch (error) {
      console.error('Failed to get latest token ID:', error);
      return 1000000;
    }
  }

  // Get NFT by token ID (for marketplace details)
  async fetchNFTByTokenId(tokenId: number): Promise<ListingNFT | null> {
    try {
      this.ensureInitialized();

      const tokenOwner = await this.datasetNFTContract!.ownerOf(tokenId);
      const nftInfo = await this.getNFTInfo(tokenId);

      if (!nftInfo || nftInfo.nftType !== NFTType.LISTING) {
        return null;
      }

      const metadataURI = await this.getTokenURI(tokenId);
      if (!metadataURI) return null;

      const metadata = await this.fetchNFTMetadata(metadataURI);
      if (!metadata) return null;

      return {
        ...metadata,
        owner: tokenOwner,
        tokenId: tokenId,
      } as ListingNFT;
    } catch (error) {
      console.error('Failed to fetch NFT by token ID:', error);
      return null;
    }
  }

  // ===================
  // ESCROW CONTRACT METHODS
  // ===================

  // Submit a purchase (buyer calls this with payment)
  async submitPurchase(
    seller: string,
    listingTokenId: number,
    datasetInfo: string,
    buyerPublicKey: string,
    priceInEth: string
  ): Promise<{ success: boolean; purchaseId?: number; transactionHash?: string; error?: string }> {
    try {
      this.ensureInitialized();

      const priceInWei = parseEther(priceInEth.toString());
      const transaction = await this.escrowContract!.submitPurchase(
        seller,
        listingTokenId,
        datasetInfo,
        buyerPublicKey, // Pass the public key to the contract
        //encryptedSecret, // Pass the encrypted secret to the contract
        { value: priceInWei } // Use value for msg.value
      );

      const receipt = await transaction.wait();

      // Extract purchase ID from the event logs (ethers v6 style)
      let purchaseId: number | undefined;
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.escrowContract!.interface.parseLog(log);
          if (parsedLog?.name === 'PurchaseSubmitted') {
            purchaseId = Number(parsedLog.args.purchaseId);
            break;
          }
        } catch {
          // Skip logs that don't match our contract
          continue;
        }
      }

      return {
        success: true,
        purchaseId,
        transactionHash: transaction.hash,
      };
    } catch (error: any) {
      console.error('Submit purchase failed:', error);
      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  // Verify ZK proof (called by authorized operators)
  async verifyZKProof(
    purchaseId: number
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      this.ensureInitialized();

      const transaction = await this.escrowContract!.verifyZKProof(purchaseId);
      await transaction.wait();

      return {
        success: true,
        transactionHash: transaction.hash,
      };
    } catch (error: any) {
      console.error('Verify ZK proof failed:', error);
      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  // Deliver dataset (seller calls this after proof verification)
  async deliverDataset(
    purchaseId: number,
    datasetMetadataURI: string
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      this.ensureInitialized();

      const transaction = await this.escrowContract!.deliverDataset(purchaseId, datasetMetadataURI);
      await transaction.wait();

      return {
        success: true,
        transactionHash: transaction.hash,
      };
    } catch (error: any) {
      console.error('Deliver dataset failed:', error);
      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  // Issue refund (buyer can call this in certain states)
  async issueRefund(
    purchaseId: number
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      this.ensureInitialized();

      const transaction = await this.escrowContract!.issueRefund(purchaseId);
      await transaction.wait();

      return {
        success: true,
        transactionHash: transaction.hash,
      };
    } catch (error: any) {
      console.error('Issue refund failed:', error);
      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  // Get purchase details
  async getPurchase(purchaseId: number): Promise<any> {
    try {
      this.ensureInitialized();

      const purchase = await this.escrowContract!.getPurchase(purchaseId);
      const purchaseState = await this.escrowContract!.getPurchaseState(purchaseId);

      return {
        buyer: purchase.buyer,
        seller: purchase.seller,
        amount: formatEther(purchase.amount),
        listingTokenId: Number(purchase.listingTokenId),
        isComplete: purchase.isComplete,
        datasetInfo: purchase.datasetInfo,
        state: Number(purchaseState.state),
        stateTimestamp: Number(purchaseState.stateTimestamp),
        timeoutDeadline: Number(purchaseState.timeoutDeadline),
        isTimedOut: purchaseState.isTimedOut,
        buyerPublicKey: purchase.buyerPublicKey,
        encryptedSecret: purchase.encryptedSecret,
      };
    } catch (error) {
      console.error('Failed to get purchase details:', error);
      return null;
    }
  }

  // ===================
  // DATASET NFT CONTRACT METHODS
  // ===================

  // Mint listing NFT (seller creates marketplace listing)
  async mintListingNFT(
    seller: string,
    metadataURI: string,
    category: string,
    priceInEth: string
  ): Promise<{ success: boolean; tokenId?: number; transactionHash?: string; error?: string }> {
    try {
      this.ensureInitialized();

      const priceInWei = parseEther(priceInEth);
      const transaction = await this.datasetNFTContract!.mintListingNFT(
        seller,
        metadataURI,
        category,
        priceInWei
      );

      const receipt = await transaction.wait();

      // Extract token ID from events (ethers v6 style)
      let tokenId: number | undefined;
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.datasetNFTContract!.interface.parseLog(log);
          if (parsedLog?.name === 'ListingNFTMinted') {
            tokenId = Number(parsedLog.args.tokenId);
            break;
          }
        } catch {
          continue;
        }
      }

      return {
        success: true,
        tokenId,
        transactionHash: transaction.hash,
      };
    } catch (error: any) {
      console.error('Mint listing NFT failed:', error);
      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  // Mint dataset NFT (happens automatically during deliverDataset)
  // This is typically called by the escrow contract, not directly by users
  async mintDatasetNFT(
    buyer: string,
    listingTokenId: number,
    datasetMetadataURI: string
  ): Promise<{ success: boolean; tokenId?: number; transactionHash?: string; error?: string }> {
    try {
      this.ensureInitialized();

      const transaction = await this.datasetNFTContract!.mintDatasetNFT(
        buyer,
        listingTokenId,
        datasetMetadataURI
      );

      const receipt = await transaction.wait();

      // Extract token ID from events
      let tokenId: number | undefined;
      for (const log of receipt.logs) {
        try {
          const parsedLog = this.datasetNFTContract!.interface.parseLog(log);
          if (parsedLog?.name === 'DatasetNFTMinted') {
            tokenId = Number(parsedLog.args.tokenId);
            break;
          }
        } catch {
          continue;
        }
      }

      return {
        success: true,
        tokenId,
        transactionHash: transaction.hash,
      };
    } catch (error: any) {
      console.error('Mint dataset NFT failed:', error);
      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  // Deactivate listing
  async deactivateListing(
    listingTokenId: number
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      this.ensureInitialized();

      const transaction = await this.datasetNFTContract!.deactivateListing(listingTokenId);
      await transaction.wait();

      return {
        success: true,
        transactionHash: transaction.hash,
      };
    } catch (error: any) {
      console.error('Deactivate listing failed:', error);
      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  // Get NFT info
  async getNFTInfo(tokenId: number): Promise<any> {
    try {
      this.ensureInitialized();

      const nftInfo = await this.datasetNFTContract!.getNFTInfo(tokenId);
      return {
        nftType: Number(nftInfo.nftType),
        creator: nftInfo.creator,
        createdAt: Number(nftInfo.createdAt),
        isActive: nftInfo.isActive,
        linkedTokenId: Number(nftInfo.linkedTokenId),
      };
    } catch (error) {
      console.error('Failed to get NFT info:', error);
      return null;
    }
  }

  // Get listing info
  async getListingInfo(listingTokenId: number): Promise<any> {
    try {
      this.ensureInitialized();

      const listingInfo = await this.datasetNFTContract!.getListingInfo(listingTokenId);
      return {
        category: listingInfo.category,
        price: formatEther(listingInfo.price),
        listedAt: Number(listingInfo.listedAt),
      };
    } catch (error) {
      console.error('Failed to get listing info:', error);
      return null;
    }
  }

  // Check if listing is active
  async isListingActive(listingTokenId: number): Promise<boolean> {
    try {
      this.ensureInitialized();
      return await this.datasetNFTContract!.isListingActive(listingTokenId);
    } catch (error) {
      console.error('Failed to check listing status:', error);
      return false;
    }
  }

  // Get token metadata URI
  async getTokenURI(tokenId: number): Promise<string | null> {
    try {
      this.ensureInitialized();
      return await this.datasetNFTContract!.tokenURI(tokenId);
    } catch (error) {
      console.error('Failed to get token URI:', error);
      return null;
    }
  }

  // Get NFT owner
  async getOwnerOf(tokenId: number): Promise<string | null> {
    try {
      this.ensureInitialized();
      return await this.datasetNFTContract!.ownerOf(tokenId);
    } catch (error) {
      console.error('Failed to get NFT owner:', error);
      return null;
    }
  }

  // ===================
  // ZK VERIFIER CONTRACT METHODS
  // ===================

  // Verify ZK proof
  async verifyProof(proof: Uint8Array, publicSignals: Uint8Array): Promise<boolean> {
    try {
      this.ensureInitialized();
      return await this.zkVerifierContract!.verifyProof(proof, publicSignals);
    } catch (error) {
      console.error('Proof verification failed:', error);
      return false;
    }
  }

  // ===================
  // UTILITY METHODS
  // ===================

  // Get user's ETH balance
  async getBalance(address: string): Promise<string> {
    try {
      if (!this.provider) {
        await this.initialize();
      }
      const balance = await this.provider!.getBalance(address);
      return formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  // Get contract balance
  async getContractBalance(): Promise<string> {
    try {
      this.ensureInitialized();
      const balance = await this.escrowContract!.getBalance();
      return formatEther(balance);
    } catch (error) {
      console.error('Failed to get contract balance:', error);
      return '0';
    }
  }

  // Get contract addresses (for debugging)
  getContractAddresses() {
    return CONTRACT_ADDRESSES;
  }

  // Get network config (for debugging)
  getNetworkConfig() {
    return NETWORK_CONFIG;
  }

  // ===================
  // EVENT LISTENERS
  // ===================

  // Listen for purchase events
  onPurchaseSubmitted(
    callback: (purchaseId: number, buyer: string, seller: string, amount: string) => void
  ) {
    if (this.escrowContract) {
      this.escrowContract.on('PurchaseSubmitted', (purchaseId, buyer, seller, amount) => {
        callback(Number(purchaseId), buyer, seller, formatEther(amount));
      });
    }
  }

  onPurchaseCompleted(callback: (purchaseId: number) => void) {
    if (this.escrowContract) {
      this.escrowContract.on('PurchaseCompleted', (purchaseId) => {
        callback(Number(purchaseId));
      });
    }
  }

  onDatasetDelivered(callback: (purchaseId: number, seller: string) => void) {
    if (this.escrowContract) {
      this.escrowContract.on('DatasetDelivered', (purchaseId, seller) => {
        callback(Number(purchaseId), seller);
      });
    }
  }

  // Listen for NFT events
  onListingNFTMinted(callback: (tokenId: number, seller: string, metadataURI: string) => void) {
    if (this.datasetNFTContract) {
      this.datasetNFTContract.on('ListingNFTMinted', (tokenId, seller, metadataURI) => {
        callback(Number(tokenId), seller, metadataURI);
      });
    }
  }

  onDatasetNFTMinted(callback: (tokenId: number, buyer: string, linkedListingId: number) => void) {
    if (this.datasetNFTContract) {
      this.datasetNFTContract.on('DatasetNFTMinted', (tokenId, buyer, linkedListingId) => {
        callback(Number(tokenId), buyer, Number(linkedListingId));
      });
    }
  }

  // Clean up event listeners
  removeAllListeners() {
    this.escrowContract?.removeAllListeners();
    this.datasetNFTContract?.removeAllListeners();
    this.zkVerifierContract?.removeAllListeners();
  }
  // ===================
  // PURCHASE FETCHING METHODS
  // ===================

  // Get all purchases made by a specific buyer
  async fetchPurchasesByBuyer(buyer: string): Promise<PurchasedListingNFT[]> {
    try {
      this.ensureInitialized();

      const purchases: PurchasedListingNFT[] = [];

      console.log('🔍 Fetching purchases for buyer:', buyer);

      // Check recent purchase IDs (assuming they start from 1)
      const maxPurchasesToCheck = 50;

      for (let purchaseId = 1; purchaseId <= maxPurchasesToCheck; purchaseId++) {
        try {
          const purchase = await this.getPurchase(purchaseId);

          if (purchase && purchase.buyer.toLowerCase() === buyer.toLowerCase()) {
            // Get the NFT details for this purchase
            const nftDetails = await this.fetchNFTByTokenId(purchase.listingTokenId);

            if (nftDetails) {
              purchases.push({
                proposer: purchase.buyer,
                nft: nftDetails,
                purchaseState: this.mapContractStateToPurchaseState(
                  purchase.state
                ) as PurchaseStateType,
                purchaseId: purchaseId,
                purchaseData: purchase,
              });
            }
          }
        } catch {
          // Purchase doesn't exist or other error, continue
          continue;
        }
      }

      console.log(`✅ Found ${purchases.length} purchases for buyer ${buyer}`);
      return purchases;
    } catch (error) {
      console.error('Failed to fetch purchases by buyer:', error);
      return [];
    }
  }

  // Get all purchases made for NFTs owned by a specific seller
  async fetchPurchasesBySeller(seller: string): Promise<PurchasedListingNFT[]> {
    try {
      this.ensureInitialized();

      const purchases: PurchasedListingNFT[] = [];

      console.log('🔍 Fetching purchases for seller:', seller);

      // Check recent purchase IDs
      const maxPurchasesToCheck = 50;

      for (let purchaseId = 1; purchaseId <= maxPurchasesToCheck; purchaseId++) {
        try {
          const purchase = await this.getPurchase(purchaseId);

          if (purchase && purchase.seller.toLowerCase() === seller.toLowerCase()) {
            // Get the NFT details for this purchase
            const nftDetails = await this.fetchNFTByTokenId(purchase.listingTokenId);

            if (nftDetails) {
              purchases.push({
                proposer: purchase.buyer,
                nft: nftDetails,
                purchaseState: this.mapContractStateToPurchaseState(
                  purchase.state
                ) as PurchaseStateType,
                purchaseId: purchaseId,
                purchaseData: purchase,
              });
            }
          }
        } catch {
          // Purchase doesn't exist or other error, continue
          continue;
        }
      }

      console.log(`✅ Found ${purchases.length} purchases for seller ${seller}`);
      return purchases;
    } catch (error) {
      console.error('Failed to fetch purchases by seller:', error);
      return [];
    }
  }
  // Simple check if a user has already purchased a license for a specific NFT
  async hasUserPurchasedLicense(buyer: string, tokenId: number): Promise<boolean> {
    try {
      this.ensureInitialized();

      // Check recent purchase IDs to find if this buyer has already purchased this token
      const maxPurchasesToCheck = 50;

      for (let purchaseId = 1; purchaseId <= maxPurchasesToCheck; purchaseId++) {
        try {
          const purchase = await this.getPurchase(purchaseId);

          if (
            purchase &&
            purchase.buyer.toLowerCase() === buyer.toLowerCase() &&
            purchase.listingTokenId === tokenId
          ) {
            return true; // User has already purchased this license
          }
        } catch {
          continue; // Purchase doesn't exist, continue checking
        }
      }

      return false; // User has not purchased this license
    } catch (error) {
      console.error('Failed to check user license:', error);
      return false; // Assume no license on error
    }
  }

  // Helper method to map smart contract purchase states to frontend purchase states
  private mapContractStateToPurchaseState(contractState: number): number {
    // Contract states: PAID=0, ZK_PROOF_SUBMITTED=1, VERIFIED=2, DELIVERED=3, COMPLETED=4, DISPUTED=5, REFUNDED=6, CANCELLED=7
    // Frontend states are different, so we need to map them

    switch (contractState) {
      case 0: // PAID
        return 1; // Frontend PAID state
      case 1: // ZK_PROOF_SUBMITTED
        return 3; // Frontend ZK_PROOF_SUBMITTED state
      case 2: // VERIFIED
        return 5; // Frontend VERIFIED state
      case 3: // DELIVERED
        return 7; // Frontend MINTED state
      case 4: // COMPLETED
        return 8; // Frontend COMPLETED state
      case 5: // DISPUTED
        return 9; // Frontend EXPIRED state (closest equivalent)
      case 6: // REFUNDED
        return 10; // Frontend REFUNDED state
      case 7: // CANCELLED
        return 11; // Frontend CANCELLED state
      default:
        return 1; // Default to PAID
    }
  }

  async setEncryptedSecret(
    purchaseId: number,
    encryptedSecret: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      this.ensureInitialized();
      const tx = await this.escrowContract!.setEncryptedSecret(purchaseId, encryptedSecret);
      await tx.wait();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to set encrypted secret' };
    }
  }
}

// Export a singleton instance
export const smartContractService = new SmartContractService();
