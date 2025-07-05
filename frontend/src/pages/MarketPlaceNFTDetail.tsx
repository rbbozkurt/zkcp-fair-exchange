import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
    !hasLicense && // Add this line
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

  return (
    <div className="flex flex-col items-center min-h-[80vh] w-full pt-24 pb-16">
      <div
        className={`
          relative
          bg-black/20
          backdrop-blur-lg
          border-2
          border-white
          rounded-2xl
          shadow-xl
          max-w-2xl
          w-full
          mx-auto
          p-8
          flex
          flex-col
          md:flex-row
          gap-10
          items-center
          transition-all
          duration-150
          group
          hover:border-2
          hover:border-pink-500
          hover:shadow-pink-500/40
        `}
        style={{
          boxShadow: '0 4px 32px 0 rgba(255,255,255,0.08)',
        }}
      >
        {/* Overlay for blur and darken */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-lg rounded-2xl z-0"></div>

        {/* Image section */}
        <div className="flex-shrink-0 flex flex-col items-center w-full md:w-1/2 z-10">
          <img
            src={nft.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
            alt={nft.name}
            className="rounded-2xl object-cover w-64 h-64 border-2 border-white shadow bg-transparent"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              (e.target as HTMLImageElement).src =
                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgdmlld0JveD0iMCAwIDI1NiAyNTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjEyOCIgeT0iMTI4IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iMC4zZW0iIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2Ij5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+';
            }}
          />
          <div className="text-xs text-gray-200 break-all bg-black/40 backdrop-blur px-2 py-1 rounded font-mono mt-4">
            {tokenId ? `Token ID: ${tokenId}` : ipfs_address}
          </div>
        </div>

        {/* Details section */}
        <div className="flex flex-col justify-between w-full md:w-1/2 z-10">
          <div>
            <h2 className="text-3xl font-extrabold text-white mb-2">{nft.name}</h2>
            <p className="text-gray-200 text-base mb-4">{nft.description}</p>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold text-white">Price:</span>{' '}
                <span className="text-white font-bold bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">
                  ${price ?? '--'} USD
                </span>
              </div>
              <div>
                <span className="font-semibold text-white">File Encoded:</span>{' '}
                <span className="text-white">{fileEnc ?? '--'}</span>
              </div>
              <div>
                <span className="font-semibold text-white">File Type:</span>{' '}
                <span className="text-white">{fileType ?? '--'}</span>
              </div>
              <div>
                <span className="font-semibold text-white">Category:</span>{' '}
                <span className="text-white">{category ?? '--'}</span>
              </div>
              <div>
                <span className="font-semibold text-white">Owner:</span>{' '}
                <span className="text-white break-all">{nft.owner ?? '--'}</span>
              </div>
              {tokenId && (
                <div>
                  <span className="font-semibold text-white">Token ID:</span>{' '}
                  <span className="text-white font-mono">{tokenId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Smart contract status */}
          {isConnected && tokenId && (
            <div className="mt-4">
              <div
                className={`text-xs px-2 py-1 rounded-full inline-block ${
                  isContractReady
                    ? 'bg-green-500/20 text-green-400 border border-green-500'
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500'
                }`}
              >
                {isContractReady ? '🟢 Smart Contract Data' : '🟡 Loading...'}
              </div>
            </div>
          )}

          {/* Show Buy button only if user is NOT the owner */}
          {(!address || nft.owner?.toLowerCase() !== address.toLowerCase()) && (
            <div className="mt-8 flex flex-col items-center">
              <button
                className={`
                  w-full py-3 rounded-full font-bold text-lg transition-all duration-200
                  border border-white
                  ${getButtonStyle()}
                `}
                onClick={onBuy}
                disabled={!canPurchase || isPurchasing || hasLicense || checkingLicense}
              >
                {getButtonText()}
              </button>

              {!isConnected && (
                <div className="mt-2 text-pink-500 text-sm animate-pulse font-bold">
                  Please connect your wallet to buy this NFT.
                </div>
              )}

              {isConnected && !isContractReady && tokenId && (
                <div className="mt-2 text-yellow-500 text-sm font-bold">
                  Loading smart contracts...
                </div>
              )}

              {isPurchasing && (
                <div className="mt-2 text-blue-400 text-sm font-bold animate-pulse">
                  Processing your purchase on the blockchain...
                </div>
              )}

              {hasLicense && (
                <div className="mt-2 text-green-400 text-sm font-bold">
                  You own a license for this dataset!
                </div>
              )}

              {checkingLicense && (
                <div className="mt-2 text-blue-400 text-sm">Checking license status...</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden WalletConnectButton trigger for programmatic click */}
      <button id="wallet-connect-btn" style={{ display: 'none' }} />
    </div>
  );
};

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

      console.log('🛒 Submitting license purchase...');
      console.log('Seller:', nft.owner);
      console.log('Token ID:', tokenId);
      console.log('Price:', priceInEth, 'ETH');
      console.log('Dataset info:', datasetInfo);

      // Submit purchase to smart contract
      const result = await smartContractService.submitPurchase(
        nft.owner!,
        Number(tokenId),
        datasetInfo,
        priceInEth
      );

      if (result.success) {
        // Update license state immediately after successful purchase
        setHasLicense(true);

        console.log('✅ License purchase submitted successfully!');
        console.log('🔗 Transaction hash:', result.transactionHash);
        console.log('🆔 Purchase ID:', result.purchaseId);

        alert(
          `✅ License purchased successfully!\n\nTransaction: ${result.transactionHash}\nPurchase ID: ${result.purchaseId}\n\n🎉 You now have access to this dataset!`
        );
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
