import React, { useState, useEffect } from 'react';
import MarketPlaceNFTCardView from '../components/MarketplaceNFTCardView';
import { useNavigate } from 'react-router-dom';
import { fetchListingNFTPreviews } from '../services/listingNftService';
import { smartContractService } from '../services/smartContractService';
import type { ListingNFTPreview } from '../types/nftTypes';
export function Marketplace() {
  const [search, setSearch] = useState('');
  const [mockListingNFTList, setMockListingNFTList] = useState<ListingNFTPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isContractReady, setIsContractReady] = useState(false);

  // Initialize smart contracts when component mounts
  useEffect(() => {
    const initializeContracts = async () => {
      const initialized = await smartContractService.initialize();
      setIsContractReady(initialized);

      if (initialized) {
        console.log('✅ Smart contracts initialized in marketplace');
      } else {
        console.warn('⚠️ Smart contracts failed to initialize, using fallback');
      }
    };

    initializeContracts();
  }, []);

  // Fetch NFTs from smart contracts or fallback to mock data
  useEffect(() => {
    const fetchNFTs = async () => {
      setIsLoading(true);
      try {
        console.log('🔍 Fetching marketplace NFTs...');
        const nfts = await fetchListingNFTPreviews();
        setMockListingNFTList(nfts);
        console.log(`✅ Loaded ${nfts.length} NFTs in marketplace`);
      } catch (error) {
        console.error('❌ Error fetching marketplace NFTs:', error);
        setMockListingNFTList([]);
      } finally {
        setIsLoading(false);
      }
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

  const handleClick = (nft: ListingNFTPreview) => {
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

  // Refresh marketplace data
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const nfts = await fetchListingNFTPreviews();
      setMockListingNFTList(nfts);
    } catch (error) {
      console.error('Error refreshing marketplace:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center pt-24 px-4">
      <div className="sticky w-full max-w-5xl text-center space-y-8">
        {/* Header with contract status */}
        <div className="top-0 z-40 bg-transparent border-b border-black/20">
          <div className="pt-6 pb-2 sticky">
            <div className="flex items-center justify-center gap-4 mb-2">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
                Marketplace
              </h1>
              {/* Contract status indicator */}
              <div
                className={`px-3 py-1 rounded-full text-xs ${
                  isContractReady
                    ? 'bg-green-500/20 text-green-400 border border-green-500'
                    : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500'
                }`}
              >
                {isContractReady ? '🟢 Live Data' : '🟡 Demo Mode'}
              </div>
            </div>
            <p className="text-xl md:text-2xl text-gray-300 mb-4">
              Browse and discover zkDrop NFTs.
            </p>
          </div>

          {/* Search bar and refresh button */}
          <div className="flex justify-center w-full top-[6.5rem] z-40 transparent border-b border-black/20">
            <div className="w-full max-w-5xl px-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1 backdrop-blur-lg bg-black/10 text-white border border-white rounded-full h-12 flex items-center shadow-md">
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
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className={`px-6 py-3 rounded-full font-bold transition-all duration-200 border ${
                    isLoading
                      ? 'bg-gray-600 text-gray-300 border-gray-500 cursor-not-allowed'
                      : 'bg-black text-white border-white hover:bg-white hover:text-black'
                  }`}
                >
                  {'↻'} Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mb-4"></div>
            <div className="text-gray-300">
              {isContractReady ? 'Loading NFTs from blockchain...' : 'Loading marketplace...'}
            </div>
          </div>
        )}

        {/* NFT cards grid */}
        {!isLoading && (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 justify-items-center mt-8">
            {filteredNFTs.length > 0 ? (
              filteredNFTs.map((nft, idx) => (
                <MarketPlaceNFTCardView
                  key={nft.tokenId || idx}
                  listingNFT={nft}
                  onClick={() => handleClick(nft)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <div className="text-gray-400 text-xl mb-4">
                  {search ? 'No NFTs found matching your search.' : 'No NFTs available yet.'}
                </div>
                {isContractReady && !search && (
                  <div className="text-gray-500 text-sm">
                    NFTs uploaded to the blockchain will appear here automatically.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Debug info for development */}
        {import.meta.env.DEV && (
          <div className="mt-8 text-xs text-gray-500 text-center">
            <div>Contract Ready: {isContractReady ? 'Yes' : 'No'}</div>
            <div>Total NFTs: {mockListingNFTList.length}</div>
            <div>Filtered: {filteredNFTs.length}</div>
          </div>
        )}
      </div>
    </div>
  );
}
