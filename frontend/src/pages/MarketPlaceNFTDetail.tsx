import React from 'react';
import { useParams } from 'react-router-dom';
import { useWalletAccount } from '../hooks/useWalletAccount';

// Mock NFT data (should be imported or moved to a shared file in real app)
const mockMintNFT: Record<string, any> = {
  'ipfs://QmMysticForestNFT': {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Mystic Forest',
    description: 'A beautiful digital painting of a mysterious forest at dawn.',
    image: 'ipfs://QmMysticForestImage',
    attributes: [
      { price_in_usd: 25.0 },
      { file_enc: 'ipfs://link_to_enc_file' },
      { file_type: '.jpg' },
      { trait_type: 'Category', value: 'Art' },
    ],
  },
  'ipfs://QmWhitepaperNFT': {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Encrypted Whitepaper',
    description: 'Access the original whitepaper, securely encrypted as a zkDrop NFT.',
    image: 'ipfs://QmWhitepaperImage',
    attributes: [
      { price_in_usd: 15.0 },
      { file_enc: 'ipfs://link_to_enc_file' },
      { file_type: '.pdf' },
      { trait_type: 'Category', value: 'Document' },
    ],
  },
  'ipfs://QmGenesisAudioNFT': {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE286981A8F8510',
    name: 'Genesis Audio',
    description: 'The first audio NFT drop, featuring exclusive music content.',
    image: 'ipfs://QmGenesisAudioImage',
    attributes: [
      { price_in_usd: 30.0 },
      { file_enc: 'ipfs://link_to_enc_file' },
      { file_type: '.mp3' },
      { trait_type: 'Category', value: 'Music' },
    ],
  },
  'ipfs://QmCollectibleCardNFT': {
    owner: '0xFA7E7a79AC32fe399E9C28cBEAE282981A8F8510',
    name: 'Rare Collectible Card',
    description: 'A legendary digital collectible card with unique artwork.',
    image: 'ipfs://QmCollectibleCardImage',
    attributes: [
      { price_in_usd: 50.0 },
      { file_enc: 'ipfs://link_to_enc_file' },
      { file_type: '.png' },
      { trait_type: 'Category', value: 'Collectible' },
    ],
  },
  'ipfs://QmZKArtNFT': {
    owner: '0xFA7E7a79AC32fe399E9C28cBE1E286981A8F8510',
    name: 'Zero-Knowledge Art',
    description: 'An abstract piece inspired by zero-knowledge cryptography.',
    image: 'ipfs://QmZKArtImage',
    attributes: [
      { price_in_usd: 40.0 },
      { file_enc: 'ipfs://link_to_enc_file' },
      { file_type: '.png' },
      { trait_type: 'Category', value: 'Art' },
    ],
  },
};

export function MarketPlaceNFTDetail() {
  const { ipfs_address } = useParams();
  const nft = ipfs_address ? mockMintNFT[decodeURIComponent(ipfs_address)] : undefined;
  const { isConnected, address } = useWalletAccount();

  // Extract all fields from attributes
  const priceAttr = nft?.attributes?.find((a: any) => a.price_in_usd !== undefined);
  const fileEncAttr = nft?.attributes?.find((a: any) => a.file_enc !== undefined);
  const fileTypeAttr = nft?.attributes?.find((a: any) => a.file_type !== undefined);
  const categoryAttr = nft?.attributes?.find((a: any) => a.trait_type === 'Category');

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

  // ...existing code...

  return (
    <div className="flex flex-col items-center min-h-[80vh] w-full pt-24 pb-16">
      <div className="w-full max-w-3xl bg-gradient-to-br from-gray-900 via-black to-gray-800 border border-pink-500/40 rounded-3xl shadow-2xl p-10 flex flex-col md:flex-row gap-10">
        {/* Image section */}
        <div className="flex-shrink-0 flex flex-col items-center w-full md:w-1/2">
          <img
            src={nft.image.replace('ipfs://', 'https://ipfs.io/ipfs/')}
            alt={nft.name}
            className="rounded-2xl object-cover w-72 h-72 border-2 border-pink-400 shadow bg-gray-900"
          />
          <div className="text-xs text-gray-400 break-all bg-gray-800/60 px-2 py-1 rounded font-mono mt-4">
            {ipfs_address}
          </div>
        </div>
        {/* Details section */}
        <div className="flex flex-col justify-between w-full md:w-1/2">
          <div>
            <h2 className="text-3xl font-extrabold text-white mb-2">{nft.name}</h2>
            <p className="text-gray-300 text-base mb-4">{nft.description}</p>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-semibold text-pink-400">Price:</span>{' '}
                <span className="text-white">${priceAttr?.price_in_usd ?? '--'} USD</span>
              </div>
              <div>
                <span className="font-semibold text-pink-400">File Encoded:</span>{' '}
                <span className="text-white">{fileEncAttr?.file_enc ?? '--'}</span>
              </div>
              <div>
                <span className="font-semibold text-pink-400">File Type:</span>{' '}
                <span className="text-white">{fileTypeAttr?.file_type ?? '--'}</span>
              </div>
              <div>
                <span className="font-semibold text-pink-400">Category:</span>{' '}
                <span className="text-white">{categoryAttr?.value ?? '--'}</span>
              </div>
              <div>
                <span className="font-semibold text-pink-400">Owner:</span>{' '}
                <span className="text-white break-all">{nft.owner ?? '--'}</span>
              </div>
            </div>
          </div>
          {/* Show Buy button only if user is NOT the owner */}
          {(!address || nft.owner?.toLowerCase() !== address.toLowerCase()) && (
            <div className="mt-8 flex flex-col items-center">
              <button
                className={`w-full py-3 rounded-full font-bold text-lg transition-all duration-200
                                        ${
                                          isConnected
                                            ? 'bg-pink-500 hover:bg-pink-600 text-white cursor-pointer'
                                            : 'bg-gray-700 text-gray-400 cursor-not-allowed relative group'
                                        }`}
                onClick={handleBuy}
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
                <div className="mt-2 text-pink-400 text-sm animate-pulse">
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
}
