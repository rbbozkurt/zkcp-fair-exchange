import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useWalletAccount } from '../hooks/useWalletAccount';
import { smartContractService } from '../services/smartContractService';
import { fetchListingNFTDetailsByIPFSAddress } from '../services/listingNftService';
import type { ListingNFT, ListingNFTAttribute } from '../types/nftTypes';

interface MarketPlaceNFTDetailCardViewProps {
  nft: ListingNFT;
  tokenId?: number;
  ipfs_address?: string;
  isConnected: boolean;
  address?: string;
  onBuy: () => void;
  isContractReady: boolean;
  isPurchasing: boolean;
  hasLicense: boolean;
  checkingLicense: boolean;
}

const getAttrValue = (attributes: ListingNFTAttribute[], trait_type: string) =>
  attributes.find((a) => a.trait_type === trait_type)?.value;

const MarketPlaceNFTDetailCardView: React.FC<MarketPlaceNFTDetailCardViewProps> = ({
  nft,
  tokenId,
  ipfs_address,
  isConnected,
  address,
  onBuy,
  isContractReady,
  isPurchasing,
  hasLicense,
  checkingLicense,
}) => {
  const navigate = useNavigate();

  console.log('NFT Details:', nft);
  const price = getAttrValue(nft.attributes, 'price_in_usd');
  const fileEnc = getAttrValue(nft.attributes, 'file_enc');
  const fileType = getAttrValue(nft.attributes, 'file_type');
  const category = getAttrValue(nft.attributes, 'category');

  const canPurchase =
    isConnected &&
    isContractReady &&
    address &&
    nft.owner?.toLowerCase() !== address.toLowerCase() &&
    !hasLicense &&
    !isPurchasing;

  const getButtonText = () => {
    if (checkingLicense) return 'Checking...';
    if (hasLicense) return 'License Owned ✓';
    if (isPurchasing) return 'Processing...';
    if (!isConnected) return 'Connect Wallet';
    if (!isContractReady) return 'Contracts Loading...';
    if (address && nft.owner?.toLowerCase() === address.toLowerCase()) return 'You Own This';
    return 'Buy License';
  };

  const getButtonStyle = () => {
    if (hasLicense) {
      return 'bg-green-600 text-white border-green-600 cursor-not-allowed';
    }
    if (isPurchasing || checkingLicense) {
      return 'bg-blue-600 text-white border-blue-600 cursor-wait';
    }
    if (canPurchase) {
      return 'bg-black text-white shadow hover:bg-white hover:text-black hover:border-black cursor-pointer';
    }
    return 'bg-gray-800 text-gray-400 border-gray-400 cursor-not-allowed opacity-60';
  };

  const handleBackToMarketplace = () => {
    navigate('/marketplace');
  };

  return (
    <div className="min-h-screen w-full pt-20 pb-16 px-4">
      {/* Back Button */}
      <div className="max-w-6xl mx-auto mb-6">
        <button
          onClick={handleBackToMarketplace}
          className="flex items-center gap-2 text-white hover:text-pink-400 transition-colors duration-200 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 hover:border-pink-400/50"
        >
          <ArrowLeft size={20} />
          <span>Back to Marketplace</span>
        </button>
      </div>

      {/* Main Card */}
      <div className="max-w-6xl mx-auto">
        <div
          className={`
            relative
            bg-black/20
            backdrop-blur-lg
            border-2
            border-white/30
            rounded-2xl
            shadow-xl
            w-full
            p-6
            lg:p-8
            transition-all
            duration-300
            group
            hover:border-pink-500/50
            hover:shadow-pink-500/20
          `}
          style={{
            boxShadow: '0 4px 32px 0 rgba(255,255,255,0.08)',
          }}
        >
          {/* Background overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-lg rounded-2xl"></div>

          {/* Content */}
          <div className="relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Left Column - Image */}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-full max-w-md">
                  <img
                    src={`https://gateway.pinata.cloud/ipfs/${nft.image}`}
                    alt={nft.name}
                    className="w-full h-auto max-h-96 object-cover rounded-2xl border-2 border-white/30 shadow-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjEyOCIgeT0iMTI4IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2Ij5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+';
                    }}
                  />
                </div>

                {/* Token ID/IPFS Address */}
                <div className="text-xs text-gray-300 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full font-mono border border-white/20">
                  {tokenId ? `Token ID: ${tokenId}` : ipfs_address}
                </div>

                {/* Contract Status */}
                {isConnected && tokenId && (
                  <div className="flex justify-center">
                    <div
                      className={`text-xs px-3 py-1 rounded-full border ${
                        isContractReady
                          ? 'bg-green-500/20 text-green-400 border-green-500/50'
                          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                      }`}
                    >
                      {isContractReady ? '🟢 Smart Contract Data' : '🟡 Loading...'}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Details */}
              <div className="flex flex-col justify-between space-y-6">
                {/* Title and Description */}
                <div className="space-y-4">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                    {nft.name}
                  </h1>
                  <p className="text-gray-200 text-base lg:text-lg leading-relaxed">
                    {nft.description}
                  </p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-sm text-gray-400 mb-1">Price</div>
                    <div className="text-xl font-bold text-white">${price ?? '--'} USD</div>
                  </div>

                  <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-sm text-gray-400 mb-1">File Encoded</div>
                    <div className="text-lg font-semibold text-white break-all">
                      {fileEnc ? (
                        <a
                          href={`https://ipfs.io/ipfs/${fileEnc}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-pink-400 transition-colors"
                        >
                          {fileEnc}
                        </a>
                      ) : (
                        '--'
                      )}
                    </div>
                  </div>

                  <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-sm text-gray-400 mb-1">File Type</div>
                    <div className="text-lg font-semibold text-white uppercase">
                      {fileType ?? '--'}
                    </div>
                  </div>

                  <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-sm text-gray-400 mb-1">Category</div>
                    <div className="text-lg font-semibold text-white capitalize">
                      {category ?? '--'}
                    </div>
                  </div>
                </div>

                {/* Owner Information */}
                <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="text-sm text-gray-400 mb-2">Owner</div>
                  <div className="text-white font-mono text-sm break-all">{nft.owner ?? '--'}</div>
                </div>

                {/* Token ID (if available) */}
                {tokenId && (
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="text-sm text-gray-400 mb-2">Token ID</div>
                    <div className="text-white font-mono text-sm">{tokenId}</div>
                  </div>
                )}

                {/* Purchase Section */}
                {(!address || nft.owner?.toLowerCase() !== address.toLowerCase()) && (
                  <div className="space-y-4">
                    <button
                      className={`
                        w-full py-4 rounded-xl font-bold text-lg transition-all duration-300
                        border-2 border-white/30
                        ${getButtonStyle()}
                        hover:scale-105 active:scale-95
                      `}
                      onClick={onBuy}
                      disabled={!canPurchase || isPurchasing || hasLicense || checkingLicense}
                    >
                      {getButtonText()}
                    </button>

                    {/* Status Messages */}
                    {!isConnected && (
                      <div className="text-center text-pink-400 text-sm font-medium bg-pink-400/10 backdrop-blur-sm p-3 rounded-lg border border-pink-400/30">
                        Please connect your wallet to buy this NFT.
                      </div>
                    )}

                    {isConnected && !isContractReady && tokenId && (
                      <div className="text-center text-yellow-400 text-sm font-medium bg-yellow-400/10 backdrop-blur-sm p-3 rounded-lg border border-yellow-400/30">
                        Loading smart contracts...
                      </div>
                    )}

                    {isPurchasing && (
                      <div className="text-center text-blue-400 text-sm font-medium bg-blue-400/10 backdrop-blur-sm p-3 rounded-lg border border-blue-400/30 animate-pulse">
                        Processing your purchase on the blockchain...
                      </div>
                    )}

                    {hasLicense && (
                      <div className="text-center text-green-400 text-sm font-medium bg-green-400/10 backdrop-blur-sm p-3 rounded-lg border border-green-400/30">
                        You own a license for this dataset!
                      </div>
                    )}

                    {checkingLicense && (
                      <div className="text-center text-blue-400 text-sm font-medium bg-blue-400/10 backdrop-blur-sm p-3 rounded-lg border border-blue-400/30">
                        Checking license status...
                      </div>
                    )}
                  </div>
                )}

                {/* Owner Message */}
                {address && nft.owner?.toLowerCase() === address.toLowerCase() && (
                  <div className="text-center text-purple-400 text-sm font-medium bg-purple-400/10 backdrop-blur-sm p-4 rounded-lg border border-purple-400/30">
                    🎨 You are the owner of this NFT
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden WalletConnectButton trigger for programmatic click */}
      <button id="wallet-connect-btn" style={{ display: 'none' }} />
    </div>
  );
};

async function getOrCreateRSAKeyPair() {
  const priv = localStorage.getItem('zkcp_rsa_private');
  const pub = localStorage.getItem('zkcp_rsa_public');
  let keyPair;

  if (priv && pub) {
    // Import both keys
    const privateKey = await window.crypto.subtle.importKey(
      'pkcs8',
      Uint8Array.from(atob(priv), (c) => c.charCodeAt(0)),
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['decrypt']
    );
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      Uint8Array.from(atob(pub), (c) => c.charCodeAt(0)),
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      true,
      ['encrypt']
    );
    keyPair = { privateKey, publicKey };
  } else {
    // Generate new key pair
    keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );
    // Export and store both keys
    const exportedPrivate = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    const exportedPublic = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
    localStorage.setItem(
      'zkcp_rsa_private',
      btoa(String.fromCharCode(...new Uint8Array(exportedPrivate)))
    );
    localStorage.setItem(
      'zkcp_rsa_public',
      btoa(String.fromCharCode(...new Uint8Array(exportedPublic)))
    );
  }

  // Export public key as PEM
  const exported = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
  const exportedAsBase64 = window.btoa(String.fromCharCode(...new Uint8Array(exported)));
  const publicKeyPEM = `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;
  return { keyPair, publicKeyPEM };
}

export function MarketPlaceNFTDetail() {
  const { ipfs_address, tokenId } = useParams();
  const location = useLocation();
  const { isConnected, address } = useWalletAccount();

  // License state
  const [hasLicense, setHasLicense] = useState(false);
  const [checkingLicense, setCheckingLicense] = useState(false);

  // Other state management
  const [nft, setNft] = useState<ListingNFT | undefined>(undefined);
  const [isContractReady, setIsContractReady] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [privateKeyPEM, setPrivateKeyPEM] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<{
    transactionHash: string;
    purchaseId: number;
  } | null>(null);

  // Initialize smart contracts
  useEffect(() => {
    const initializeContracts = async () => {
      if (isConnected) {
        const initialized = await smartContractService.initialize();
        setIsContractReady(initialized);

        if (!initialized) {
          console.error('❌ Failed to initialize smart contracts');
        }
      } else {
        setIsContractReady(false);
      }
    };

    initializeContracts();
  }, [isConnected]);

  // Fetch NFT details based on whether we have tokenId or ipfs_address
  useEffect(() => {
    const fetchNFT = async () => {
      setIsLoading(true);

      try {
        let fetchedNFT: ListingNFT | undefined;

        if (tokenId) {
          // New route: /marketplace/token/:tokenId
          console.log('🔍 Fetching NFT by token ID:', tokenId);

          // Try to get from location state first (passed from marketplace)
          if (location.state?.nft) {
            fetchedNFT = location.state.nft;
            console.log('✅ Got NFT from navigation state');
          } else {
            // Fallback: fetch from smart contract
            console.log('📡 Fetching NFT from smart contract...');
            const contractInitialized = await smartContractService.initialize();

            if (contractInitialized) {
              const fetched = await smartContractService.fetchNFTByTokenId(Number(tokenId));
              fetchedNFT = fetched === null ? undefined : fetched;
            }
          }
        } else if (ipfs_address) {
          // Legacy route: /marketplace/:ipfs_address
          console.log('🔍 Fetching NFT by IPFS address:', ipfs_address);
          fetchedNFT = await fetchListingNFTDetailsByIPFSAddress(decodeURIComponent(ipfs_address));
        }

        if (fetchedNFT) {
          setNft(fetchedNFT);
          console.log('✅ NFT details loaded:', fetchedNFT);
        } else {
          console.error('❌ NFT not found');
        }
      } catch (error) {
        console.error('❌ Error fetching NFT details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNFT();
  }, [tokenId, ipfs_address, location.state]);

  // Check license status when contract is ready and we have user address
  useEffect(() => {
    const checkUserLicense = async () => {
      if (isContractReady && address && tokenId) {
        setCheckingLicense(true);

        try {
          const userHasLicense = await smartContractService.hasUserPurchasedLicense(
            address,
            Number(tokenId)
          );
          setHasLicense(userHasLicense);
          console.log(
            `🎫 License check for token ${tokenId}: ${userHasLicense ? 'HAS LICENSE' : 'NO LICENSE'}`
          );
        } catch (error) {
          console.error('Error checking license:', error);
          setHasLicense(false);
        } finally {
          setCheckingLicense(false);
        }
      } else {
        // Reset license state if conditions not met
        setHasLicense(false);
        setCheckingLicense(false);
      }
    };

    checkUserLicense();
  }, [isContractReady, address, tokenId]);

  const handleBuy = async () => {
    if (!isConnected) {
      document.getElementById('wallet-connect-btn')?.click();
      return;
    }

    // Check if user already owns a license
    if (hasLicense) {
      alert('You already own a license for this dataset!');
      return;
    }

    // Prevent double-clicking for this specific user
    if (isPurchasing) {
      console.log('⚠️ Purchase already in progress, ignoring click');
      return;
    }

    if (!isContractReady || !nft || !address) {
      setPurchaseError('Smart contracts not ready or missing data');
      return;
    }

    if (!tokenId) {
      setPurchaseError('Token ID is required for purchase');
      return;
    }

    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      // Get price from NFT attributes
      const priceUSD = getAttrValue(nft.attributes, 'price_in_usd');
      if (!priceUSD) {
        throw new Error('Price not found in NFT metadata');
      }

      // Simple USD to ETH conversion (you might want to use a real conversion API)
      const priceInEth = (parseFloat(priceUSD.toString()) * 0.0003).toFixed(6);

      // Create purchase info
      const datasetInfo = `License purchase of ${nft.name} - ${nft.description}`;
      const { publicKeyPEM } = await getOrCreateRSAKeyPair();

      console.log('🛒 Submitting license purchase...');
      console.log('Seller:', nft.owner);
      console.log('Token ID:', tokenId);
      console.log('Price:', priceInEth, 'ETH');
      console.log('Dataset info:', datasetInfo);
      console.log('Buyer public key:', publicKeyPEM);

      // Submit purchase to smart contract
      const result = await smartContractService.submitPurchase(
        nft.owner!,
        Number(tokenId),
        datasetInfo,
        publicKeyPEM,
        priceInEth
      );

      if (result.success) {
        setHasLicense(true);
        // Store purchase details and show modal instead of alert
        setPurchaseDetails({
          transactionHash: result.transactionHash!,
          purchaseId: result.purchaseId!,
        });
        setShowSuccessModal(true);

        // Export private key as PEM for backup
        const priv = localStorage.getItem('zkcp_rsa_private');
        if (priv) {
          const exportedAsBase64 = priv.match(/.{1,64}/g)?.join('\n') || priv;
          const privateKeyPEM = `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`;
          setPrivateKeyPEM(privateKeyPEM);
        }

        console.log('✅ License purchase submitted successfully!');
        console.log('🔗 Transaction hash:', result.transactionHash);
        console.log('🆔 Purchase ID:', result.purchaseId);
      } else {
        throw new Error(result.error || 'License purchase failed');
      }
    } catch (error: any) {
      console.error('❌ License purchase failed:', error);
      setPurchaseError(error.message || 'License purchase failed');

      // Show user-friendly error messages
      const errorMessage = error.message || 'License purchase failed';
      if (errorMessage.includes('user rejected')) {
        alert('❌ Transaction was rejected by user');
      } else if (errorMessage.includes('insufficient funds')) {
        alert('❌ Insufficient funds for this license purchase');
      } else {
        alert(`❌ License purchase failed: ${errorMessage}`);
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4"></div>
        <div className="text-2xl">Loading NFT details...</div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <div className="text-2xl mb-4">NFT not found.</div>
        <div className="text-sm">
          {tokenId
            ? `Token ID ${tokenId} does not exist or is not active.`
            : 'Invalid NFT address.'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <MarketPlaceNFTDetailCardView
        nft={nft}
        tokenId={tokenId ? Number(tokenId) : undefined}
        ipfs_address={ipfs_address}
        isConnected={isConnected}
        address={address}
        onBuy={handleBuy}
        isContractReady={isContractReady}
        isPurchasing={isPurchasing}
        hasLicense={hasLicense}
        checkingLicense={checkingLicense}
      />

      {/* Merged Success & Key Export Modal */}
      {showSuccessModal && purchaseDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-black/20 backdrop-blur-lg rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl border-2 border-green-500/50 max-h-[90vh] overflow-y-auto">
            <div className="text-center space-y-6">
              <div className="text-4xl">🎉</div>
              <h3 className="text-2xl font-bold text-green-400">License Purchase Initiated!</h3>
              <p className="text-gray-200">
                Your purchase has been submitted to the blockchain. You are now waiting for the
                seller to deliver the dataset access.
              </p>

              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-4 space-y-2 text-left">
                <div className="text-sm">
                  <span className="text-gray-400">Transaction:</span>
                  <div className="text-xs font-mono text-white break-all mt-1">
                    {purchaseDetails.transactionHash}
                  </div>
                </div>
                <div className="text-sm">
                  <span className="text-gray-400">Purchase ID:</span>
                  <span className="text-white ml-2">{purchaseDetails.purchaseId}</span>
                </div>
              </div>

              {/* Private Key Section */}
              {privateKeyPEM && (
                <div className="bg-yellow-400/10 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/30">
                  <h4 className="text-lg font-bold text-yellow-400 mb-2">
                    🔐 Important: Save Your Private Key
                  </h4>
                  <p className="text-sm text-gray-200 mb-3">
                    This key is required to decrypt your purchased dataset. Save it securely!
                  </p>
                  <textarea
                    value={privateKeyPEM}
                    readOnly
                    className="w-full h-32 bg-black/50 text-white text-xs font-mono p-3 rounded border border-white/20 resize-none"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <button
                      onClick={(e) => {
                        navigator.clipboard.writeText(privateKeyPEM);
                        const button = e.target as HTMLButtonElement;
                        button.textContent = '✅ Copied!';
                        button.className =
                          'py-2 font-bold rounded-lg transition-colors bg-green-500 text-white';
                      }}
                      className="py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors"
                    >
                      Copy Private Key
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([privateKeyPEM], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'zkcp_private_key.pem';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg transition-colors"
                    >
                      Download Key File
                    </button>
                  </div>
                </div>
              )}

              <div className="text-sm text-yellow-400 bg-yellow-400/10 backdrop-blur-sm p-3 rounded-lg border border-yellow-400/30">
                ⏳ Waiting for seller to deliver dataset access
              </div>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setPurchaseDetails(null);
                  setPrivateKeyPEM(null);
                }}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {purchaseError && (
        <div className="fixed bottom-4 right-4 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="font-bold">Purchase Error</div>
          <div className="text-sm">{purchaseError}</div>
          <button className="mt-2 text-xs underline" onClick={() => setPurchaseError(null)}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
