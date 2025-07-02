import React, { useState, useEffect } from 'react';
import MarketPlaceNFTCardView from '../components/MarketPlaceNFTCardView';
import { useNavigate } from 'react-router-dom';
import { fetchListingNFTs } from '../services/listingNftService';
import type { ListingNFTPreview } from '../types/nftTypes';

export function Marketplace() {
  const [search, setSearch] = useState('');
  const [mockListingNFTList, setMockListingNFTList] = useState<ListingNFTPreview[]>([]);
  // Simulate fetching NFTs from a service
  useEffect(() => {
    const fetchNFTs = async () => {
      const nfts = await fetchListingNFTs();
      setMockListingNFTList(nfts);
    };

    fetchNFTs();
  }, []);

  // Filter NFTs by name or description (case-insensitive)
  const filteredNFTs = mockListingNFTList.filter(
    (nft) =>
      nft.name.toLowerCase().includes(search.toLowerCase()) ||
      nft.description.toLowerCase().includes(search.toLowerCase())
  );

  const navigate = useNavigate();

  const handleClick = (ipfs_address: string) => {
    navigate(`/marketplace/${encodeURIComponent(ipfs_address)}`, {
      state: { address: ipfs_address },
    });
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center pt-24 px-4">
      <div className="w-full max-w-5xl text-center space-y-8">
        {/* Sticky header: title, subtitle, and search bar together */}
        <div className="sticky top-0 z-40 bg-black/60 backdrop-blur-lg border-b border-black/20">
          <div className="pt-6 pb-2">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-2">
              Marketplace
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-4">
              Browse and discover zkDrop NFTs.
            </p>
            <div className="flex justify-center w-full">
              <div className="w-full max-w-5xl px-4">
                <div className="backdrop-blur-lg bg-black text-white border border-white rounded-full h-12 flex items-center shadow-md">
                  <input
                    type="text"
                    placeholder="Search NFTs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-12 px-8 bg-transparent text-white text-lg rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder-gray-300"
                    style={{
                      textShadow: '0 1px 2px rgba(0,0,0,0.4)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* NFT cards grid */}
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-items-center mt-8">
          {filteredNFTs.length > 0 ? (
            filteredNFTs.map((nft, idx) => {
              // Find ipfs_address attribute
              const ipfsAttr = nft.attributes.find((a) => a.trait_type === 'ipfs_address');
              return (
                <MarketPlaceNFTCardView
                  key={idx}
                  listingNFT={nft}
                  onClick={() =>
                    handleClick(typeof ipfsAttr?.value === 'string' ? ipfsAttr.value : '')
                  }
                />
              );
            })
          ) : (
            <div className="col-span-full text-gray-400">No NFTs found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
