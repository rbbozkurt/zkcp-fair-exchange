import React, { useState } from 'react';
import { useWalletAccount } from '../hooks/useWalletAccount';
import { UploadModal } from '../components/UploadModal';
import { encryptAndUpload } from '../services/fileService';

// --- Portfolio Page ---
export function Portfolio() {
  const { isConnected } = useWalletAccount();
  const [showModal, setShowModal] = useState(false);

  // Dummy handler for upload
  // ...existing code...
  const handleUpload = (
    data: {
      name: string;
      description: string;
      price_in_usd: number;
      file_type: string;
      category: string;
      secret: string;
      file: File;
      image?: File | null;
    },
    done: (success: boolean, errorMsg?: string) => void
  ) => {
    encryptAndUpload(data)
      .then((response) => {
        console.log('File uploaded successfully:', response);
        done(true);
      })
      .catch((error) => {
        console.error('Error uploading file:', error);
        done(false, error.message);
      });
    console.log('Uploaded NFT:', data);
    done(true);
  };
  // ...existing code...

  return (
    <div className="bg-black text-white min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
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
            <div>
              <h2 className="text-4xl font-bold text-pink-400 mb-4 text-left">On Marketplace</h2>
              {/* Add NFTs listed on the marketplace here */}
              <div className="text-gray-400 text-left">No NFTs listed on the marketplace yet.</div>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-yellow-400 mb-4 text-left">Pending</h2>
              {/* Add NFTs pending mint or approval here */}
              <div className="text-gray-400 text-left">No pending NFTs.</div>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-green-400 mb-4 text-left">Minted</h2>
              {/* Add NFTs that are minted and owned by the user here */}
              <div className="text-gray-400 text-left">No minted NFTs in your portfolio.</div>
            </div>
          </div>
        )}
      </div>
      <UploadModal open={showModal} onClose={() => setShowModal(false)} onSubmit={handleUpload} />
    </div>
  );
}
