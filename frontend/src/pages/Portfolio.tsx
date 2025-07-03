import React, { useState, useEffect } from 'react';
import { useWalletAccount } from '../hooks/useWalletAccount';
import { UploadModal } from '../components/UploadModal';
import { encryptAndUpload } from '../services/fileService';
import type { UploadedDocument } from '../types/nftTypes';

import {
  type ListingNFTPreview,
  type PurchasedListingNFT,
  type PurchaseStateType,
  type Role,
  PurchaseActions,
} from '../types/nftTypes';
import MarketPlaceNFTCardView from '../components/MarketPlaceNFTCardView';
import PortfolioNFTPurchasedCardView from '../components/PortfolioNFTPurchasedCardView';
import {
  fetchListingNFTPreviewsByOwner,
  fetchPurchasedListingNFTPreviewsByProposer,
  fetchPurchasedListingNFTPreviewsByOwner,
} from '../services/listingNftService';
import { useNavigate } from 'react-router-dom';

export function Portfolio() {
  const { isConnected, address } = useWalletAccount();
  const [showModal, setShowModal] = useState(false);

  const [marketplaceListingNFTs, setMarketplaceListingNFTs] = useState<ListingNFTPreview[]>([]);
  const [proposedByMe, setProposedByMe] = useState<PurchasedListingNFT[]>([]);
  const [proposedToMe, setProposedToMe] = useState<PurchasedListingNFT[]>([]);

  useEffect(() => {
    if (!address) {
      setMarketplaceListingNFTs([]);
      setProposedByMe([]);
      setProposedToMe([]);
      return;
    }
    fetchListingNFTPreviewsByOwner(address)
      .then((nfts) => setMarketplaceListingNFTs(nfts))
      .catch((error) => console.error('Error fetching marketplace NFTs:', error));
    fetchPurchasedListingNFTPreviewsByProposer(address)
      .then((nfts) => setProposedByMe(nfts))
      .catch((error) => console.error('Error fetching purchased NFTs:', error));
    fetchPurchasedListingNFTPreviewsByOwner(address)
      .then((nfts) => setProposedToMe(nfts))
      .catch((error) => console.error('Error fetching purchased NFTs:', error));
  }, [address]);

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

  const handleUpload = (
    uploadedDocument: UploadedDocument,
    done: (success: boolean, errorMsg?: string) => void
  ) => {
    if (!address) {
      done(false, 'Wallet address is not available.');
      return;
    }
    encryptAndUpload(uploadedDocument, address)
      .then((response) => {
        console.log('File uploaded successfully:', response);

        // call smart contract to mint NFT
        done(true);
      })
      .catch((error) => {
        console.error('Error uploading file:', error);
        done(false, error.message);
      });
    console.log('Uploaded NFT:', uploadedDocument);
  };

  const navigate = useNavigate();

  const handleMarketPlaceClick = (ipfs_address: string) => {
    navigate(`/marketplace/${encodeURIComponent(ipfs_address)}`, {
      state: { address: ipfs_address },
    });
  };

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center pt-24 px-4">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        <div className="flex items-center pt-6 justify-between">
          <div>
            <h1 className="text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-2 text-left">
              Your Portfolio
            </h1>
            <p className="text-2xl text-gray-300 mb-4 text-left">Showcase your zkDrop NFTs.</p>
          </div>
          <button
            className="h-14 px-8 ml-4 bg-black text-white border border-white rounded-full font-bold shadow transition-all text-lg hover:bg-white hover:text-black hover:border-black"
            onClick={() => setShowModal(true)}
          >
            + Upload Document
          </button>
        </div>
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center min-h-[30vh]">
            <div className="text-pink-400 text-xl font-semibold animate-pulse">
              Please connect your wallet to view your portfolio.
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* On Marketplace */}
            <div>
              <h2 className="text-4xl font-bold text-pink-400 mb-4 text-left">On Marketplace</h2>
              {marketplaceListingNFTs.length === 0 ? (
                <div className="text-gray-400 text-left">
                  No NFTs listed on the marketplace yet.
                </div>
              ) : (
                <div className="flex overflow-x-auto space-x-6 pb-2">
                  {marketplaceListingNFTs.map((nft, idx) => {
                    const ipfsAttr = nft.attributes.find((a) => a.trait_type === 'ipfs_address');

                    return (
                      <div key={idx} className="min-w-[320px]">
                        <MarketPlaceNFTCardView
                          key={idx}
                          listingNFT={nft}
                          onClick={() =>
                            handleMarketPlaceClick(
                              typeof ipfsAttr?.value === 'string' ? ipfsAttr.value : ''
                            )
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Proposed to me */}
            <div>
              <h2 className="text-4xl font-bold text-yellow-400 mb-4 text-left">Proposed to me</h2>
              {proposedToMe.length === 0 ? (
                <div className="text-gray-400 text-left">No proposals found.</div>
              ) : (
                <div className="flex overflow-x-auto space-x-6 pb-2">
                  {proposedToMe.map((nft, idx) => {
                    const role = address === nft.nft.owner ? 'owner' : 'proposer';
                    return (
                      <div key={idx} className="min-w-[320px]">
                        <PortfolioNFTPurchasedCardView
                          purchasedNFT={nft}
                          role={role}
                          onClick={() => handlePurchasedNFTClicked(nft, role)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Proposed by me */}
            <div>
              <h2 className="text-4xl font-bold text-blue-400 mb-4 text-left">Proposed by me</h2>
              {proposedByMe.length === 0 ? (
                <div className="text-gray-400 text-left">No proposals found.</div>
              ) : (
                <div className="flex overflow-x-auto space-x-6 pb-2">
                  {proposedByMe.map((nft, idx) => {
                    const role = address === nft.nft.owner ? 'owner' : 'proposer';
                    return (
                      <div key={idx} className="min-w-[320px]">
                        <PortfolioNFTPurchasedCardView
                          purchasedNFT={nft}
                          role={role}
                          onClick={() => handlePurchasedNFTClicked(nft, role)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Minted */}
            <div>
              <h2 className="text-4xl font-bold text-green-400 mb-4 text-left">Minted</h2>
              <div className="text-gray-400 text-left">No minted NFTs in your portfolio.</div>
            </div>
          </div>
        )}
      </div>
      <UploadModal open={showModal} onClose={() => setShowModal(false)} onSubmit={handleUpload} />
    </div>
  );
}
