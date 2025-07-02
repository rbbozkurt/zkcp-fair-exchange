import React, { useState } from 'react';
import MarketPlaceNFTCardView from '../components/MarketPlaceNFTCardView';
import { useNavigate } from 'react-router-dom';

const mockListingNFTList = [
  {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Mystic Forest',
    description: 'A beautiful digital painting of a mysterious forest at dawn.',
    image: 'ipfs://QmMysticForestImage',
    attributes: [{ price_in_usd: 25.0 }, { ipfs_address: 'ipfs://QmMysticForestNFT' }],
  },
  {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Encrypted Whitepaper',
    description: 'Access the original whitepaper, securely encrypted as a zkDrop NFT.',
    image: 'ipfs://QmWhitepaperImage',
    attributes: [{ price_in_usd: 15.0 }, { ipfs_address: 'ipfs://QmWhitepaperNFT' }],
  },
  {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Genesis Audio',
    description: 'The first audio NFT drop, featuring exclusive music content.',
    image: 'ipfs://QmGenesisAudioImage',
    attributes: [{ price_in_usd: 30.0 }, { ipfs_address: 'ipfs://QmGenesisAudioNFT' }],
  },
  {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE282981A8F8510',
    name: 'Rare Collectible Card',
    description: 'A legendary digital collectible card with unique artwork.',
    image: 'ipfs://QmCollectibleCardImage',
    attributes: [{ price_in_usd: 50.0 }, { ipfs_address: 'ipfs://QmCollectibleCardNFT' }],
  },
  {
    owner: '0xFA7E7a79AC32fe399E9C28cBE1E286981A8F8510',
    name: 'Zero-Knowledge Art',
    description: 'An abstract piece inspired by zero-knowledge cryptography.',
    image: 'ipfs://QmZKArtImage',
    attributes: [{ price_in_usd: 40.0 }, { ipfs_address: 'ipfs://QmZKArtNFT' }],
  },
];
/*
const mockNFTs = [
    {
        name: 'NFT Title',
        description: 'Description of the NFT',
        image: 'ipfs://link_to_img_file',
        attributes: [
            { file_enc: 'ipfs://link_to_enc_file', },
            { file_type: '.pdf', },
            { price_in_usd: 10.0 },
            { category: 'Art' },
        ],
    },
// Add more NFT objects as needed
];
*/

export function Marketplace() {
  const [search, setSearch] = useState('');

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
                <div className="backdrop-blur-lg bg-black/10 border rounded-full h-16 flex items-center shadow-md">
                  <input
                    type="text"
                    placeholder="Search NFTs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-16 px-8 bg-transparent text-white text-lg rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400 placeholder-gray-300"
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
              const priceAttr = nft.attributes.find((a) => a.price_in_usd !== undefined);
              const ipfsAttr = nft.attributes.find((a) => a.ipfs_address !== undefined);
              return (
                <MarketPlaceNFTCardView
                  key={ipfsAttr?.ipfs_address || idx}
                  name={nft.name}
                  description={nft.description}
                  image={nft.image}
                  price_in_usd={priceAttr?.price_in_usd ?? 0}
                  ipfs_address={ipfsAttr?.ipfs_address ?? ''}
                  onClick={() => handleClick(ipfsAttr?.ipfs_address || '')}
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
