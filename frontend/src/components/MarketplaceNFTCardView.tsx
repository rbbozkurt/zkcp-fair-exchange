import React from 'react';

interface MarketPlaceNFTCardViewProps {
  name: string;
  description: string;
  image: string;
  price_in_usd: number;
  ipfs_address: string;
  onClick?: () => void; // Optional click handler
}

const MarketPlaceNFTCardView: React.FC<MarketPlaceNFTCardViewProps> = ({
  name,
  description,
  image,
  price_in_usd,
  ipfs_address,
  onClick,
}) => {
  onClick = onClick || (() => {});

  return (
    <div
      className="relative bg-gradient-to-br from-gray-900 via-black to-gray-800 border border-pink-500/40 rounded-2xl shadow-xl max-w-xs mx-auto p-4 flex flex-col items-center space-y-3 cursor-pointer hover:scale-105 hover:shadow-pink-500/30 transition-all duration-300 group"
      onClick={onClick}
    >
      {/* Glow effect */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-pink-500/30 to-purple-500/20 blur-lg opacity-60 group-hover:opacity-90 transition-opacity -z-10"></div>
      <div className="w-full flex justify-center">
        <img
          src={image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
          alt={name}
          className="rounded-xl object-cover w-32 h-32 border-2 border-pink-400 shadow bg-gray-900 transition-transform group-hover:scale-105"
        />
      </div>
      <h2 className="text-lg font-extrabold text-white tracking-wide drop-shadow-pink-500/40 text-center">
        {name}
      </h2>
      <p className="text-gray-300 text-xs text-center px-1 line-clamp-2">{description}</p>
      <div className="flex items-center space-x-2 mt-1">
        <span className="inline-block bg-pink-500/20 px-2 py-0.5 rounded-full text-pink-400 font-bold text-base shadow">
          ${price_in_usd} USD
        </span>
      </div>
      <div className="text-[10px] text-gray-400 break-all bg-gray-800/60 px-1 py-0.5 rounded mt-1 font-mono">
        {ipfs_address}
      </div>
    </div>
  );
};

export default MarketPlaceNFTCardView;
