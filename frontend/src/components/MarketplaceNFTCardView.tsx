// Update your MarketPlaceNFTCardView component with this fixed version

import React from 'react';
import type { ListingNFTPreview } from '../types/nftTypes';

interface MarketPlaceNFTCardViewProps {
  listingNFT: ListingNFTPreview;
  onClick: () => void;
}

const MarketPlaceNFTCardView: React.FC<MarketPlaceNFTCardViewProps> = ({ listingNFT, onClick }) => {
  // Get price from attributes
  const priceAttr = listingNFT.attributes.find((attr) => attr.trait_type === 'price_in_usd');
  const price = priceAttr?.value;

  // Convert IPFS image URL to HTTP
  const imageUrl = listingNFT.image?.replace('ipfs://', 'https://ipfs.io/ipfs/') || '';

  return (
    <div
      className="relative w-80 h-96 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl group border-2 border-white/20 hover:border-white/40"
      onClick={onClick}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
          backgroundColor: imageUrl ? 'transparent' : '#333',
        }}
      >
        {/* Fallback for no image */}
        {!imageUrl && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 19 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z"
                fill="currentColor"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

      {/* Content overlay */}
      <div className="absolute inset-0 p-6 flex flex-col justify-between">
        {/* Top section - minimal for clean look */}
        <div className="flex justify-end">
          {listingNFT.tokenId && (
            <div className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white/80">
              #{listingNFT.tokenId}
            </div>
          )}
        </div>

        {/* Bottom section - title, description, price */}
        <div className="space-y-3">
          {/* Title */}
          <h3 className="text-xl font-bold text-white drop-shadow-lg">{listingNFT.name}</h3>

          {/* Description */}
          <p className="text-sm text-white/90 drop-shadow-md line-clamp-2">
            {listingNFT.description}
          </p>

          {/* Price */}
          <div className="flex items-center justify-between">
            <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full">
              <span className="text-white font-bold text-lg">${price || '--'} USD</span>
            </div>

            {/* Owner indicator */}
            <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <span className="text-white/80 text-xs">
                {listingNFT.owner ? `${listingNFT.owner.slice(0, 6)}...` : 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover effect border glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl border-2 border-pink-500/50 shadow-lg shadow-pink-500/20"></div>
      </div>
    </div>
  );
};

export default MarketPlaceNFTCardView;
