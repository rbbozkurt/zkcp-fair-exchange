import React, { useState, useEffect } from 'react';
import { useWalletAccount } from '../hooks/useWalletAccount';
import { UploadModal } from '../components/UploadModal';
import { encryptAndUpload } from '../services/fileService';
import { smartContractService } from '../services/smartContractService';
import type { UploadedDocument } from '../types/nftTypes';

import {
  type ListingNFTPreview,
  type PurchasedListingNFT,
  type PurchaseStateType,
  type Role,
  PurchaseActions,
} from '../types/nftTypes';
import MarketPlaceNFTCardView from '../components/MarketPlaceNFTCardView';
import PortfolioNFTPurchasedCardView from '../components/PortfolioNFTPurchasedCardView';
import {
  fetchListingNFTPreviewsByOwner,
  fetchPurchasedListingNFTPreviewsByProposer,
  fetchPurchasedListingNFTPreviewsByOwner,
} from '../services/listingNftService';
import { useNavigate } from 'react-router-dom';

export function Portfolio() {
  const { isConnected, address } = useWalletAccount();
  const [showModal, setShowModal] = useState(false);
  const [isSmartContractReady, setIsSmartContractReady] = useState(false);
  const [uploadingNFT, setUploadingNFT] = useState(false);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);

  const [marketplaceListingNFTs, setMarketplaceListingNFTs] = useState<ListingNFTPreview[]>([]);
  const [proposedByMe, setProposedByMe] = useState<PurchasedListingNFT[]>([]);
  const [proposedToMe, setProposedToMe] = useState<PurchasedListingNFT[]>([]);

  // Initialize smart contract service when wallet connects
  useEffect(() => {
    const initializeContracts = async () => {
      if (isConnected) {
        const initialized = await smartContractService.initialize();
        setIsSmartContractReady(initialized);

        if (initialized) {
          console.log('✅ Smart contracts initialized successfully');
          console.log('📋 Contract addresses:', smartContractService.getContractAddresses());
        } else {
          console.error('❌ Failed to initialize smart contracts');
        }
      } else {
        setIsSmartContractReady(false);
      }
    };

    initializeContracts();
  }, [isConnected]);

  // Fetch NFTs when address changes or contracts are ready
  useEffect(() => {
    const fetchNFTs = async () => {
      if (!address) {
        setMarketplaceListingNFTs([]);
        setProposedByMe([]);
        setProposedToMe([]);
        return;
      }

      setIsLoadingNFTs(true);

      try {
        console.log('🔍 Fetching NFTs for address:', address);

        // Fetch marketplace listings (now from smart contract)
        const marketplaceNFTs = await fetchListingNFTPreviewsByOwner(address);
        setMarketplaceListingNFTs(marketplaceNFTs);
        console.log(`✅ Loaded ${marketplaceNFTs.length} marketplace NFTs`);

        // Fetch purchased NFTs (still using mock data for now)
        const proposedByMeNFTs = await fetchPurchasedListingNFTPreviewsByProposer(address);
        setProposedByMe(proposedByMeNFTs);

        const proposedToMeNFTs = await fetchPurchasedListingNFTPreviewsByOwner(address);
        setProposedToMe(proposedToMeNFTs);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
      } finally {
        setIsLoadingNFTs(false);
      }
    };

    fetchNFTs();
  }, [address, isSmartContractReady]);

  const handlePurchasedNFTClicked = (nft: PurchasedListingNFT, role: Role) => {
    const action = PurchaseActions[nft.purchaseState]?.[role];
    if (action && action.nextState !== undefined) {
      // Update the purchaseState
      const updatedNFT = { ...nft, purchaseState: action.nextState as PurchaseStateType };

      // Update in proposedToMe
      setProposedToMe((prev) => prev.map((item) => (item === nft ? updatedNFT : item)));
      // Update in proposedByMe
      setProposedByMe((prev) => prev.map((item) => (item === nft ? updatedNFT : item)));
    }
  };

  // Updated upload handler with smart contract integration
  const handleUpload = async (
    uploadedDocument: UploadedDocument,
    done: (success: boolean, errorMsg?: string) => void
  ) => {
    if (!address) {
      done(false, 'Wallet address is not available.');
      return;
    }

    if (!isSmartContractReady) {
      done(false, 'Smart contracts are not initialized. Please try again.');
      return;
    }

    setUploadingNFT(true);

    try {
      // Step 1: Initialize smart contract service
      const initialized = await smartContractService.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize smart contracts');
      }
      console.log('✅ Smart contracts initialized');

      // Step 2: Encrypt and upload to IPFS
      console.log('📤 Uploading to IPFS...');
      const uploadResponse = await encryptAndUpload(uploadedDocument, address);
      console.log('✅ File uploaded to IPFS:', uploadResponse);

      // Step 3: Extract metadata for NFT minting
      const metadataIPFS = uploadResponse.attributes.find(
        (attr) => attr.trait_type === 'ipfs_address'
      )?.value as string;

      if (!metadataIPFS) {
        throw new Error('Failed to get IPFS metadata URI from upload');
      }

      const metadataURI = `ipfs://${metadataIPFS}`;
      const category = uploadedDocument.category || 'General';

      // Convert USD to ETH (simple conversion - you might want to use a real API)
      const priceInEth = (uploadedDocument.price_in_usd * 0.0003).toFixed(6);

      console.log('🏗️ Minting NFT with data:', {
        seller: address,
        metadataURI,
        category,
        priceInEth,
      });

      // Step 4: Mint listing NFT on smart contract
      console.log('⛓️ Minting listing NFT...');
      const mintResult = await smartContractService.mintListingNFT(
        address,
        metadataURI,
        category,
        priceInEth
      );

      if (!mintResult.success) {
        throw new Error(mintResult.error || 'Failed to mint NFT');
      }

      console.log('🎉 NFT minted successfully!');
      console.log('📊 Mint result:', mintResult);

      // Step 5: Refresh the marketplace listings to show new NFT
      console.log('🔄 Refreshing marketplace listings...');
      const updatedNFTs = await fetchListingNFTPreviewsByOwner(address);
      setMarketplaceListingNFTs(updatedNFTs);

      // Success!
      done(true);
    } catch (error: any) {
      console.error('❌ Upload and minting failed:', error);
      done(false, error.message || 'Upload and minting failed');
    } finally {
      setUploadingNFT(false);
    }
  };

  const navigate = useNavigate();

  const handleMarketPlaceClick = (nft: ListingNFTPreview) => {
    // If we have a tokenId from smart contract, use it; otherwise use ipfs_address
    if (nft.tokenId) {
      navigate(`/marketplace/token/${nft.tokenId}`, {
        state: { tokenId: nft.tokenId, nft },
      });
    } else {
      // Fallback to IPFS address for mock data
      const ipfsAttr = nft.attributes.find((a) => a.trait_type === 'ipfs_address');
      const ipfs_address = typeof ipfsAttr?.value === 'string' ? ipfsAttr.value : '';
      navigate(`/marketplace/${encodeURIComponent(ipfs_address)}`, {
        state: { address: ipfs_address },
      });
    }
  };

  // Show contract status
  const renderContractStatus = () => {
    if (!isConnected) return null;

    return (
      <div
        className={`text-sm px-3 py-1 rounded-full ${
          isSmartContractReady
            ? 'bg-green-500/20 text-green-400 border border-green-500'
            : 'bg-red-500/20 text-red-400 border border-red-500'
        }`}
      >
        {isSmartContractReady ? '🟢 Contracts Connected' : '🔴 Contracts Disconnected'}
      </div>
    );
  };

  // Test contract connection function
  const testContractConnection = async () => {
    console.log('🧪 Testing smart contract connection...');

    try {
      const initialized = await smartContractService.initialize();

      if (!initialized) {
        console.error('❌ Failed to initialize smart contract service');
        return;
      }

      console.log('✅ Smart contract service initialized successfully');

      const addresses = smartContractService.getContractAddresses();
      console.log('📋 Contract addresses:', addresses);

      const network = smartContractService.getNetworkConfig();
      console.log('🌐 Network config:', network);

      const account = await smartContractService.getCurrentAccount();
      console.log('👤 Current account:', account);

      if (account) {
        const balance = await smartContractService.getBalance(account);
        console.log('💰 Account balance:', balance, 'ETH');
      }

      const contractBalance = await smartContractService.getContractBalance();
      console.log('🏦 Contract balance:', contractBalance, 'ETH');

      console.log('🎉 All tests passed! Smart contracts are connected.');
    } catch (error) {
      console.error('❌ Contract connection test failed:', error);
    }
  };

  const [encFile, setEncFile] = useState<File | null>(null);
  const [secretKey, setSecretKey] = useState('');
  const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);

  const handleDecryptFile = async () => {
    if (!encFile || !secretKey) {
      alert('Please select a file and enter a secret.');
      return;
    }
    try {
      const { decryptFileWithSecret } = await import('../services/fileService');
      const decryptedFile = await decryptFileWithSecret(encFile, secretKey);
      const url = URL.createObjectURL(decryptedFile);
      setDecryptedUrl(url);
    } catch (error) {
      alert('Decryption failed: ' + (error as any).message);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center pt-24 px-4">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        <div className="flex items-center pt-6 justify-between">
          <div>
            <h1 className="text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-2 text-left">
              Your Portfolio
            </h1>
            <p className="text-2xl text-gray-300 mb-4 text-left">Showcase your zkDrop NFTs.</p>
            {renderContractStatus()}
          </div>
          <div className="flex flex-col items-end space-y-2">
            {isSmartContractReady && (
              <div className="text-xs text-gray-400">
                Network: {smartContractService.getNetworkConfig().name}
              </div>
            )}
            <div className="flex gap-2">
              <button
                className={`h-14 px-8 border rounded-full font-bold shadow transition-all text-lg ${
                  isConnected && isSmartContractReady
                    ? 'bg-black text-white border-white hover:bg-white hover:text-black hover:border-black'
                    : 'bg-gray-800 text-gray-400 border-gray-400 cursor-not-allowed'
                }`}
                onClick={() => setShowModal(true)}
                disabled={!isConnected || !isSmartContractReady || uploadingNFT}
              >
                {uploadingNFT ? '⏳ Uploading...' : '+ Upload Document'}
              </button>
              {import.meta.env.DEV && (
                <button
                  onClick={testContractConnection}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  Test Connection
                </button>
              )}
            </div>
          </div>
        </div>

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[30vh]">
            <div className="text-pink-400 text-xl font-semibold animate-pulse">
              Please connect your wallet to view your portfolio.
            </div>
          </div>
        ) : !isSmartContractReady ? (
          <div className="flex flex-col items-center justify-center min-h-[30vh]">
            <div className="text-red-400 text-xl font-semibold">
              Smart contracts are not connected. Please check your network and try refreshing.
            </div>
            <button
              className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* On Marketplace */}
            <div>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-4xl font-bold text-pink-400">On Marketplace</h2>
                {isLoadingNFTs && (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-400"></div>
                )}
              </div>
              {isLoadingNFTs ? (
                <div className="text-gray-400 text-left">Loading your NFTs...</div>
              ) : marketplaceListingNFTs.length === 0 ? (
                <div className="text-gray-400 text-left">
                  No NFTs listed on the marketplace yet.
                  {isSmartContractReady && (
                    <div className="text-sm text-gray-500 mt-1">
                      Upload a document to create your first NFT!
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex overflow-x-auto space-x-6 pb-2">
                  {marketplaceListingNFTs.map((nft, idx) => (
                    <div key={nft.tokenId || idx} className="min-w-[320px]">
                      <MarketPlaceNFTCardView
                        listingNFT={nft}
                        onClick={() => handleMarketPlaceClick(nft)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Proposed to me */}
            <div>
              <h2 className="text-4xl font-bold text-yellow-400 mb-4 text-left">Proposed to me</h2>
              {proposedToMe.length === 0 ? (
                <div className="text-gray-400 text-left">No proposals found.</div>
              ) : (
                <div className="flex overflow-x-auto space-x-6 pb-2">
                  {proposedToMe.map((nft, idx) => {
                    const role = address === nft.nft.owner ? 'owner' : 'proposer';
                    return (
                      <div key={idx} className="min-w-[320px]">
                        <PortfolioNFTPurchasedCardView
                          purchasedNFT={nft}
                          role={role}
                          onClick={() => handlePurchasedNFTClicked(nft, role)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Proposed by me */}
            <div>
              <h2 className="text-4xl font-bold text-blue-400 mb-4 text-left">Proposed by me</h2>
              {proposedByMe.length === 0 ? (
                <div className="text-gray-400 text-left">No proposals found.</div>
              ) : (
                <div className="flex overflow-x-auto space-x-6 pb-2">
                  {proposedByMe.map((nft, idx) => {
                    const role = address === nft.nft.owner ? 'owner' : 'proposer';
                    return (
                      <div key={idx} className="min-w-[320px]">
                        <PortfolioNFTPurchasedCardView
                          purchasedNFT={nft}
                          role={role}
                          onClick={() => handlePurchasedNFTClicked(nft, role)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Minted */}
            <div>
              <h2 className="text-4xl font-bold text-green-400 mb-4 text-left">Minted</h2>
              <div className="text-gray-400 text-left">
                No minted NFTs in your portfolio.
                <div className="text-sm text-gray-500 mt-1">
                  NFTs you purchase will appear here after completion.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {import.meta.env.DEV && (
        <div className="w-full max-w-5xl mt-8 bg-gray-800 p-4 rounded text-white">
          <h2 className="text-lg font-bold mb-2">🔐 Developer: Decrypt Encrypted File</h2>
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept=".enc"
              onChange={(e) => setEncFile(e.target.files?.[0] || null)}
              className="text-white"
            />
            <input
              type="text"
              placeholder="Enter secret key"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="bg-gray-700 text-white p-2 rounded"
            />
            <button
              onClick={handleDecryptFile}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Decrypt File
            </button>
            {decryptedUrl && (
              <a
                href={decryptedUrl}
                download="decrypted_file"
                className="text-green-400 underline mt-2"
              >
                Download Decrypted File
              </a>
            )}
          </div>
        </div>
      )}
      <UploadModal open={showModal} onClose={() => setShowModal(false)} onSubmit={handleUpload} />
    </div>
  );
}
