import { ethers, BrowserProvider, Contract, parseEther, formatEther } from 'ethers';

// Contract addresses (update with your deployed addresses)
const CONTRACT_ADDRESSES = {
  ESCROW: '0x...', // Your escrow contract address
  DATASET_NFT: '0x...', // Your dataset NFT contract address
  ZK_VERIFIER: '0x...', // Your ZK verifier contract address
};

// Contract ABIs (import from your artifacts)
import EscrowABI from '../../../artifacts/contracts/Escrow.sol/Escrow.json';
import DatasetNFTABI from '../../../artifacts/contracts/DatasetNFT.sol/DatasetNFT.json';
import ZKVerifierABI from '../../../artifacts/contracts/ZK-Verifier.sol/ZKVerifier.json';

// Constants matching contract enums, get out of comment when we have the context for them
/*const PurchaseState = {
  PAID: 0,
  ZK_PROOF_SUBMITTED: 1,
  VERIFIED: 2,
  DELIVERED: 3,
  COMPLETED: 4,
  DISPUTED: 5,
  REFUNDED: 6,
  CANCELLED: 7
} as const;

const NFTType = {
  LISTING: 0,
  DATASET: 1
} as const;*/

// Type definitions for better TypeScript support
//type PurchaseStateType = typeof PurchaseState[keyof typeof PurchaseState];
//type NFTTypeType = typeof NFTType[keyof typeof NFTType];

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

        // Initialize contracts
        this.escrowContract = new Contract(
          CONTRACT_ADDRESSES.ESCROW,
          EscrowABI.abi || EscrowABI,
          this.signer
        );

        this.datasetNFTContract = new Contract(
          CONTRACT_ADDRESSES.DATASET_NFT,
          DatasetNFTABI.abi || DatasetNFTABI,
          this.signer
        );

        this.zkVerifierContract = new Contract(
          CONTRACT_ADDRESSES.ZK_VERIFIER,
          ZKVerifierABI.abi || ZKVerifierABI,
          this.signer
        );

        return true;
      } else {
        throw new Error('MetaMask not found');
      }
    } catch (error) {
      console.error('Failed to initialize smart contract service:', error);
      return false;
    }
  }

  // Get current connected account
  async getCurrentAccount(): Promise<string | null> {
    try {
      if (!this.signer) await this.initialize();
      return (await this.signer?.getAddress()) || null;
    } catch (error) {
      console.error('Failed to get current account:', error);
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
    priceInEth: string
  ): Promise<{ success: boolean; purchaseId?: number; transactionHash?: string; error?: string }> {
    try {
      if (!this.escrowContract) {
        throw new Error('Contract not initialized');
      }

      const priceInWei = parseEther(priceInEth);
      const transaction = await this.escrowContract.submitPurchase(
        seller,
        listingTokenId,
        datasetInfo,
        { value: priceInWei }
      );

      const receipt = await transaction.wait();

      // Extract purchase ID from the event
      const purchaseEvent = receipt.events?.find(
        (event: any) => event.event === 'PurchaseSubmitted'
      );
      const purchaseId = purchaseEvent?.args?.purchaseId?.toNumber();

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
      if (!this.escrowContract) {
        throw new Error('Contract not initialized');
      }

      const transaction = await this.escrowContract.verifyZKProof(purchaseId);
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
      if (!this.escrowContract) {
        throw new Error('Contract not initialized');
      }

      const transaction = await this.escrowContract.deliverDataset(purchaseId, datasetMetadataURI);
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
      if (!this.escrowContract) {
        throw new Error('Contract not initialized');
      }

      const transaction = await this.escrowContract.issueRefund(purchaseId);
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
      if (!this.escrowContract) {
        throw new Error('Contract not initialized');
      }

      const purchase = await this.escrowContract.getPurchase(purchaseId);
      const purchaseState = await this.escrowContract.getPurchaseState(purchaseId);

      return {
        buyer: purchase.buyer,
        seller: purchase.seller,
        amount: formatEther(purchase.amount),
        listingTokenId: purchase.listingTokenId.toNumber(),
        isComplete: purchase.isComplete,
        datasetInfo: purchase.datasetInfo,
        state: purchaseState.state,
        stateTimestamp: purchaseState.stateTimestamp.toNumber(),
        timeoutDeadline: purchaseState.timeoutDeadline.toNumber(),
        isTimedOut: purchaseState.isTimedOut,
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
      if (!this.datasetNFTContract) {
        throw new Error('Contract not initialized');
      }

      const priceInWei = parseEther(priceInEth);
      const transaction = await this.datasetNFTContract.mintListingNFT(
        seller,
        metadataURI,
        category,
        priceInWei
      );

      const receipt = await transaction.wait();

      // Extract token ID from events
      const mintEvent = receipt.events?.find((event: any) => event.event === 'ListingNFTMinted');
      const tokenId = mintEvent?.args?.tokenId?.toNumber();

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
      if (!this.datasetNFTContract) {
        throw new Error('Contract not initialized');
      }

      const transaction = await this.datasetNFTContract.mintDatasetNFT(
        buyer,
        listingTokenId,
        datasetMetadataURI
      );

      const receipt = await transaction.wait();

      // Extract token ID from events
      const mintEvent = receipt.events?.find((event: any) => event.event === 'DatasetNFTMinted');
      const tokenId = mintEvent?.args?.tokenId?.toNumber();

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
      if (!this.datasetNFTContract) {
        throw new Error('Contract not initialized');
      }

      const transaction = await this.datasetNFTContract.deactivateListing(listingTokenId);
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
      if (!this.datasetNFTContract) {
        throw new Error('Contract not initialized');
      }

      const nftInfo = await this.datasetNFTContract.getNFTInfo(tokenId);
      return {
        nftType: nftInfo.nftType,
        creator: nftInfo.creator,
        createdAt: nftInfo.createdAt.toNumber(),
        isActive: nftInfo.isActive,
        linkedTokenId: nftInfo.linkedTokenId.toNumber(),
      };
    } catch (error) {
      console.error('Failed to get NFT info:', error);
      return null;
    }
  }

  // Get listing info
  async getListingInfo(listingTokenId: number): Promise<any> {
    try {
      if (!this.datasetNFTContract) {
        throw new Error('Contract not initialized');
      }

      const listingInfo = await this.datasetNFTContract.getListingInfo(listingTokenId);
      return {
        category: listingInfo.category,
        price: formatEther(listingInfo.price),
        listedAt: listingInfo.listedAt.toNumber(),
      };
    } catch (error) {
      console.error('Failed to get listing info:', error);
      return null;
    }
  }

  // Check if listing is active
  async isListingActive(listingTokenId: number): Promise<boolean> {
    try {
      if (!this.datasetNFTContract) {
        throw new Error('Contract not initialized');
      }

      return await this.datasetNFTContract.isListingActive(listingTokenId);
    } catch (error) {
      console.error('Failed to check listing status:', error);
      return false;
    }
  }

  // Get token metadata URI
  async getTokenURI(tokenId: number): Promise<string | null> {
    try {
      if (!this.datasetNFTContract) {
        throw new Error('Contract not initialized');
      }

      const tokenURI = await this.datasetNFTContract.tokenURI(tokenId);
      return tokenURI;
    } catch (error) {
      console.error('Failed to get token URI:', error);
      return null;
    }
  }

  // Get NFT owner
  async getOwnerOf(tokenId: number): Promise<string | null> {
    try {
      if (!this.datasetNFTContract) {
        throw new Error('Contract not initialized');
      }

      return await this.datasetNFTContract.ownerOf(tokenId);
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
      if (!this.zkVerifierContract) {
        throw new Error('Contract not initialized');
      }

      const isValid = await this.zkVerifierContract.verifyProof(proof, publicSignals);
      return isValid;
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
        throw new Error('Provider not initialized');
      }

      const balance = await this.provider.getBalance(address);
      return formatEther(balance);
    } catch (error) {
      console.error('Failed to get balance:', error);
      return '0';
    }
  }

  // Get contract balance
  async getContractBalance(): Promise<string> {
    try {
      if (!this.escrowContract) {
        throw new Error('Contract not initialized');
      }

      const balance = await this.escrowContract.getBalance();
      return formatEther(balance);
    } catch (error) {
      console.error('Failed to get contract balance:', error);
      return '0';
    }
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
        callback(purchaseId.toNumber(), buyer, seller, formatEther(amount));
      });
    }
  }

  onPurchaseCompleted(callback: (purchaseId: number) => void) {
    if (this.escrowContract) {
      this.escrowContract.on('PurchaseCompleted', (purchaseId) => {
        callback(purchaseId.toNumber());
      });
    }
  }

  onDatasetDelivered(callback: (purchaseId: number, seller: string) => void) {
    if (this.escrowContract) {
      this.escrowContract.on('DatasetDelivered', (purchaseId, seller) => {
        callback(purchaseId.toNumber(), seller);
      });
    }
  }

  // Listen for NFT events
  onListingNFTMinted(callback: (tokenId: number, seller: string, metadataURI: string) => void) {
    if (this.datasetNFTContract) {
      this.datasetNFTContract.on('ListingNFTMinted', (tokenId, seller, metadataURI) => {
        callback(tokenId.toNumber(), seller, metadataURI);
      });
    }
  }

  onDatasetNFTMinted(callback: (tokenId: number, buyer: string, linkedListingId: number) => void) {
    if (this.datasetNFTContract) {
      this.datasetNFTContract.on('DatasetNFTMinted', (tokenId, buyer, linkedListingId) => {
        callback(tokenId.toNumber(), buyer, linkedListingId.toNumber());
      });
    }
  }

  // Clean up event listeners
  removeAllListeners() {
    this.escrowContract?.removeAllListeners();
    this.datasetNFTContract?.removeAllListeners();
    this.zkVerifierContract?.removeAllListeners();
  }
}

// Export a singleton instance
export const smartContractService = new SmartContractService();
