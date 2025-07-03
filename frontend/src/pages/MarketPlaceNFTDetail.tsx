import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWalletAccount } from '../hooks/useWalletAccount';
import { fetchListingNFTDetailsByIPFSAddress } from '../services/listingNftService';
import type { ListingNFT, ListingNFTAttribute } from '../types/nftTypes';

interface MarketPlaceNFTDetailCardViewProps {
  nft: ListingNFT;
  ipfs_address?: string;
  isConnected: boolean;
  address?: string;
  onBuy: () => void;
}

const getAttrValue = (attributes: ListingNFTAttribute[], trait_type: string) =>
  attributes.find((a) => a.trait_type === trait_type)?.value;

const MarketPlaceNFTDetailCardView: React.FC<MarketPlaceNFTDetailCardViewProps> = ({
  nft,
  ipfs_address,
  isConnected,
  address,
  onBuy,
}) => {
  console.log('NFT Details:', nft);
  const price = getAttrValue(nft.attributes, 'price_in_usd');
  const fileEnc = getAttrValue(nft.attributes, 'file_enc');
  const fileType = getAttrValue(nft.attributes, 'file_type');
  const category = getAttrValue(nft.attributes, 'category');

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
          />
          <div className="text-xs text-gray-200 break-all bg-black/40 backdrop-blur px-2 py-1 rounded font-mono mt-4">
            {ipfs_address}
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
            </div>
          </div>
          {/* Show Buy button only if user is NOT the owner */}
          {(!address || nft.owner?.toLowerCase() !== address.toLowerCase()) && (
            <div className="mt-8 flex flex-col items-center">
              <button
                className={`
                  w-full py-3 rounded-full font-bold text-lg transition-all duration-200
                  border border-white
                  ${
                    isConnected
                      ? 'bg-black text-white shadow hover:bg-white hover:text-black hover:border-black cursor-pointer'
                      : 'bg-gray-800 text-gray-400 border-gray-400 cursor-not-allowed opacity-60'
                  }
                `}
                onClick={onBuy}
                disabled={!isConnected}
                onMouseEnter={(e) => {
                  if (!isConnected) {
                    (e.currentTarget as HTMLButtonElement).textContent =
                      'Please connect your wallet';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isConnected) {
                    (e.currentTarget as HTMLButtonElement).textContent = 'Buy';
                  }
                }}
              >
                {isConnected ? 'Buy' : 'Buy'}
              </button>
              {!isConnected && (
                <div className="mt-2 text-pink-500 text-sm animate-pulse font-bold">
                  Please connect your wallet to buy this NFT.
                </div>
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
  const { ipfs_address } = useParams();
  const { isConnected, address } = useWalletAccount();

  // Fetch NFT details
  const [nft, setNft] = useState<ListingNFT | undefined>(undefined);

  useEffect(() => {
    const fetchNFT = async () => {
      if (ipfs_address) {
        const fetchedNFT = await fetchListingNFTDetailsByIPFSAddress(
          decodeURIComponent(ipfs_address)
        );
        setNft(fetchedNFT);
      }
    };
    fetchNFT();
  }, [ipfs_address]);

  const handleBuy = () => {
    if (!isConnected) {
      document.getElementById('wallet-connect-btn')?.click();
    } else {
      alert('Buying NFT...');
    }
  };

  if (!nft) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <div className="text-2xl">NFT not found.</div>
      </div>
    );
  }

  return (
    <MarketPlaceNFTDetailCardView
      nft={nft}
      ipfs_address={ipfs_address}
      isConnected={isConnected}
      address={address}
      onBuy={handleBuy}
    />
  );
}
