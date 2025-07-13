import React, { useState, useEffect } from 'react';
import { useWalletAccount } from '../hooks/useWalletAccount';
import { UploadModal } from '../components/UploadModal';
import {
  encryptAndUpload,
  encryptWithRSAPublicKey,
  decryptWithRSAPrivateKey,
  decryptFileWithSecret,
} from '../services/fileService';
import { smartContractService } from '../services/smartContractService';
import type { UploadedDocument } from '../types/nftTypes';

import {
  type ListingNFTPreview,
  type PurchasedListingNFT,
  type PurchaseStateType,
  type Role,
  PurchaseActions,
} from '../types/nftTypes';
import MarketPlaceNFTCardView from '../components/MarketplaceNFTCardView';
import PortfolioNFTPurchasedCardView from '../components/PortfolioNFTPurchasedCardView';
import Carousel from '../components/Carousel'; // Import the new carousel component
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
  const [mintedNFTs, setMintedNFTs] = useState<PurchasedListingNFT[]>([]);

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
        setMintedNFTs([]);
        return;
      }

      setIsLoadingNFTs(true);

      try {
        console.log('🔍 Fetching NFTs for address:', address);

        // Fetch marketplace listings (now from smart contract)
        const marketplaceNFTs = await fetchListingNFTPreviewsByOwner(address);
        setMarketplaceListingNFTs(marketplaceNFTs);
        console.log(`✅ Loaded ${marketplaceNFTs.length} marketplace NFTs`);

        // Fetch purchased NFTs (proposed by me)
        let proposedByMeNFTs = await fetchPurchasedListingNFTPreviewsByProposer(address);
        // Fetch purchaseData for each
        proposedByMeNFTs = await Promise.all(
          proposedByMeNFTs.map(async (nft) => {
            if (typeof nft.purchaseId === 'number') {
              try {
                const purchaseData = await smartContractService.getPurchase(nft.purchaseId);
                console.log('[DEBUG] proposedByMe NFT', nft.purchaseId, purchaseData);
                return { ...nft, purchaseData };
              } catch (e) {
                console.error('[DEBUG] Error fetching purchaseData for', nft.purchaseId, e);
                return nft;
              }
            }
            return nft;
          })
        );

        // Separate NFTs: those with secrets delivered go to "minted", others stay in "proposed by me"
        const mintedNFTs = proposedByMeNFTs.filter((nft) => !!nft.purchaseData?.encryptedSecret);
        const stillProposedByMe = proposedByMeNFTs.filter(
          (nft) => !nft.purchaseData?.encryptedSecret
        );

        setProposedByMe(stillProposedByMe);
        setMintedNFTs(mintedNFTs);

        // Fetch purchased NFTs (proposed to me)
        let proposedToMeNFTs = await fetchPurchasedListingNFTPreviewsByOwner(address);
        // Fetch purchaseData for each
        proposedToMeNFTs = await Promise.all(
          proposedToMeNFTs.map(async (nft) => {
            if (typeof nft.purchaseId === 'number') {
              try {
                const purchaseData = await smartContractService.getPurchase(nft.purchaseId);
                console.log('[DEBUG] proposedToMe NFT', nft.purchaseId, purchaseData);
                return { ...nft, purchaseData };
              } catch (e) {
                console.error('[DEBUG] Error fetching purchaseData for', nft.purchaseId, e);
                return nft;
              }
            }
            return nft;
          })
        );
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

  // Seller-side: Encrypt and deliver the secret
  const handleEncryptAndDeliver = async (nft: PurchasedListingNFT) => {
    try {
      if (typeof nft.purchaseId !== 'number') {
        alert('Invalid purchase ID.');
        return;
      }
      const purchase = await smartContractService.getPurchase(nft.purchaseId);
      const buyerPublicKeyPEM = purchase.buyerPublicKey;

      if (!buyerPublicKeyPEM) {
        alert("Buyer's public key is missing!");
        return;
      }

      const fileSecret = prompt('Enter the file secret to encrypt for the buyer:');
      if (!fileSecret) {
        alert('File secret is required!');
        return;
      }

      console.log('Encrypting secret:', fileSecret);
      console.log('With buyer public key:', buyerPublicKeyPEM);

      const encryptedSecret = await encryptWithRSAPublicKey(buyerPublicKeyPEM, fileSecret);

      const result = await smartContractService.setEncryptedSecret(nft.purchaseId, encryptedSecret);

      if (result.success) {
        alert('Encrypted secret delivered to buyer!');
        // Refresh purchase data after delivery
        const updatedPurchase = await smartContractService.getPurchase(nft.purchaseId);
        // Update in proposedToMe
        setProposedToMe((prev) =>
          prev.map((item) =>
            item.purchaseId === nft.purchaseId ? { ...item, purchaseData: updatedPurchase } : item
          )
        );
        // Update in proposedByMe (in case the user is both buyer and seller)
        setProposedByMe((prev) =>
          prev.map((item) =>
            item.purchaseId === nft.purchaseId ? { ...item, purchaseData: updatedPurchase } : item
          )
        );
      } else {
        alert('Failed to deliver encrypted secret: ' + result.error);
      }
    } catch (err) {
      alert('Error: ' + (err as any).message);
      console.error(err);
    }
  };

  const handleDecryptAndDownload = async (nft: PurchasedListingNFT) => {
    try {
      // 1. Fetch purchase details (get encrypted secret)
      if (typeof nft.purchaseId !== 'number') {
        alert('Invalid purchase ID.');
        return;
      }
      const purchase = await smartContractService.getPurchase(nft.purchaseId);
      const encryptedSecret = purchase.encryptedSecret;

      // 2. Get the private key PEM (from localStorage or prompt)
      let privateKeyPEM = localStorage.getItem('zkcp_rsa_private_pem');
      if (!privateKeyPEM) {
        privateKeyPEM = prompt('Paste your private key PEM:');
        if (!privateKeyPEM) return;
      }

      // 3. Decrypt the secret
      const decryptedSecret = await decryptWithRSAPrivateKey(privateKeyPEM, encryptedSecret);

      // 4. Download the encrypted file from IPFS
      const fileEncHash = nft.nft.attributes.find((a) => a.trait_type === 'file_enc')?.value;
      const fileUrl = `https://gateway.pinata.cloud/ipfs/${fileEncHash}`;
      const response = await fetch(fileUrl);
      const fileBlob = await response.blob();
      const file = new File([fileBlob], 'downloaded.enc');

      // 5. Decrypt the file
      const decryptedFile = await decryptFileWithSecret(file, decryptedSecret);

      // 6. Determine file extension from NFT type attribute and create filename with NFT name
      let fileType =
        nft.nft.attributes.find((a) => a.trait_type === 'type')?.value ||
        nft.nft.attributes.find((a) => a.trait_type === 'file_type')?.value;
      if (typeof fileType !== 'string' || !fileType.trim()) {
        fileType = 'bin'; // fallback if type is missing or empty
      }
      // Clean up fileType to avoid invalid extensions
      fileType = fileType.replace(/[^a-zA-Z0-9]/g, '');

      // Use NFT name for filename, sanitized for file system
      const sanitizedNFTName = nft.nft.name.replace(/[^a-zA-Z0-9\s\-_]/g, '');
      const fileName = `${sanitizedNFTName}.${fileType}`;

      // 7. Download the decrypted file
      const url = URL.createObjectURL(decryptedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error: ' + (err as any).message);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center pt-24 px-4">
      <div className="w-full max-w-7xl mx-auto space-y-8">
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
              <div className="flex items-center gap-4 mb-6">
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
                <Carousel>
                  {marketplaceListingNFTs.map((nft, idx) => (
                    <MarketPlaceNFTCardView
                      key={nft.tokenId || idx}
                      listingNFT={nft}
                      onClick={() => handleMarketPlaceClick(nft)}
                    />
                  ))}
                </Carousel>
              )}
            </div>

            {/* Proposed to me */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-4xl font-bold text-blue-400 text-left">Proposed to me</h2>
              </div>
              {proposedToMe.length === 0 ? (
                <div className="text-gray-400 text-left">No proposals found.</div>
              ) : (
                <Carousel>
                  {proposedToMe.map((nft, idx) => {
                    const role = address === nft.nft.owner ? 'owner' : 'proposer';
                    const secretDelivered = !!nft.purchaseData?.encryptedSecret;
                    return (
                      <div key={idx} className="space-y-3">
                        <PortfolioNFTPurchasedCardView
                          purchasedNFT={nft}
                          role={role}
                          onClick={() => handlePurchasedNFTClicked(nft, role)}
                        />
                        {/* DEBUG: Show purchaseId and encryptedSecret */}
                        <div className="text-xs text-gray-500 break-all bg-gray-800/50 p-2 rounded">
                          <div>purchaseId: {String(nft.purchaseId)}</div>
                          <div>
                            encryptedSecret: {nft.purchaseData?.encryptedSecret ? 'Yes' : 'No'}
                          </div>
                        </div>
                        {role === 'owner' && nft.purchaseState === 1 && (
                          <>
                            <button
                              onClick={() => handleEncryptAndDeliver(nft)}
                              className={`w-full bg-blue-500 text-white px-4 py-2 rounded transition-colors ${
                                secretDelivered
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:bg-blue-600'
                              }`}
                              disabled={secretDelivered}
                            >
                              Encrypt & Deliver Secret
                            </button>
                            <div className="text-xs text-center">
                              {secretDelivered ? (
                                <span className="text-green-400">Secret delivered to buyer ✓</span>
                              ) : (
                                <span className="text-yellow-400">Waiting for delivery</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </Carousel>
              )}
            </div>

            {/* Proposed by me */}
            <div>
              <h2 className="text-4xl font-bold text-blue-400 mb-6 text-left">Proposed by me</h2>
              {proposedByMe.length === 0 ? (
                <div className="text-gray-400 text-left">No proposals found.</div>
              ) : (
                <Carousel>
                  {proposedByMe.map((nft, idx) => {
                    const role = address === nft.nft.owner ? 'owner' : 'proposer';
                    const secretDelivered = !!nft.purchaseData?.encryptedSecret;
                    return (
                      <div key={idx} className="space-y-3">
                        <PortfolioNFTPurchasedCardView
                          purchasedNFT={nft}
                          role={role}
                          onClick={() => handlePurchasedNFTClicked(nft, role)}
                        />
                        {role === 'proposer' && secretDelivered && (
                          <>
                            <button
                              onClick={() => handleDecryptAndDownload(nft)}
                              className="w-full bg-green-500 text-white px-4 py-2 rounded transition-colors hover:bg-green-600"
                            >
                              Decrypt Secret & Download File
                            </button>
                            <div className="text-xs text-center">
                              <span className="text-green-400">Secret delivered by seller ✓</span>
                            </div>
                          </>
                        )}
                        {role === 'proposer' && !secretDelivered && (
                          <div className="text-xs text-center text-yellow-400">
                            Waiting for seller to deliver secret
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Carousel>
              )}
            </div>

            {/* Minted */}
            <div>
              <h2 className="text-4xl font-bold text-green-400 mb-6 text-left">Minted</h2>
              {mintedNFTs.length === 0 ? (
                <div className="text-gray-400 text-left">
                  No minted NFTs in your portfolio.
                  <div className="text-sm text-gray-500 mt-1">
                    NFTs you purchase will appear here after the seller delivers the secret.
                  </div>
                </div>
              ) : (
                <Carousel>
                  {mintedNFTs.map((nft, idx) => {
                    const role = address === nft.nft.owner ? 'owner' : 'proposer';
                    return (
                      <div key={idx} className="space-y-3">
                        <PortfolioNFTPurchasedCardView
                          purchasedNFT={nft}
                          role={role}
                          onClick={() => handlePurchasedNFTClicked(nft, role)}
                        />
                        {/* Download button for minted NFTs */}
                        <button
                          onClick={() => handleDecryptAndDownload(nft)}
                          className="w-full bg-green-500 text-white px-4 py-2 rounded transition-colors hover:bg-green-600"
                        >
                          Decrypt & Download Dataset
                        </button>
                        <div className="text-xs text-center">
                          <span className="text-green-400">✅ Ready to download</span>
                        </div>
                      </div>
                    );
                  })}
                </Carousel>
              )}
            </div>
          </div>
        )}
      </div>
      {import.meta.env.DEV && (
        <div className="w-full max-w-7xl mt-8 bg-gray-800 p-4 rounded text-white">
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
