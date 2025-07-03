import React, { useState, useRef } from 'react';
import type { UploadedDocument } from '../types/nftTypes';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    uploadedDocument: UploadedDocument,
    done: (success: boolean, errorMsg?: string) => void
  ) => void;
}

const State = {
  EDITING: 'EDITING',
  SUBMITTED: 'SUBMITTED',
  ON_SUCCESS: 'ON_SUCCESS',
  ON_ERROR: 'ON_ERROR',
} as const;
type ModalState = (typeof State)[keyof typeof State];

// Helper to generate a random 32-character alphanumeric secret
function generateRandomSecret(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const UploadModal: React.FC<UploadModalProps> = ({ open, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [fileType, setFileType] = useState('');
  const [category, setCategory] = useState('');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  // File/image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [mainFileName, setMainFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [modalState, setModalState] = useState<ModalState>(State.EDITING);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!open) return null;

  // Handle drag & drop for main file
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setMainFile(e.dataTransfer.files[0]);
      setMainFileName(e.dataTransfer.files[0].name);
    }
  };

  // Handle drag & drop for image
  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMainFile(e.target.files[0]);
      setMainFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainFile) {
      alert('Please upload a file to mint as NFT.');
      return;
    }
    setModalState(State.SUBMITTED);
    setErrorMsg('');
    onSubmit(
      {
        name,
        description,
        price_in_usd: Number(price),
        type: fileType, // <-- change here
        category,
        secret,
        file: mainFile,
        image: imageFile,
      },
      (success: boolean, errorMsg?: string) => {
        if (success) {
          setModalState(State.ON_SUCCESS);
          setTimeout(() => {
            setModalState(State.EDITING);
            onClose();
            // Reset form after closing
            setName('');
            setDescription('');
            setPrice('');
            setFileType('');
            setCategory('');
            setSecret('');
            setImageFile(null);
            setImagePreview(null);
            setMainFile(null);
            setMainFileName('');
            setErrorMsg('');
          }, 1500);
        } else {
          setModalState(State.ON_ERROR);
          setErrorMsg(errorMsg || 'An error occurred. Please try again.');
        }
      }
    );
  };

  const isEditing = modalState === State.EDITING;
  const isSubmitting = modalState === State.SUBMITTED;
  const isError = modalState === State.ON_ERROR;
  const isSuccess = modalState === State.ON_SUCCESS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <form
        onSubmit={handleSubmit}
        className="bg-black/20 backdrop-blur-lg rounded-2xl p-8 max-w-lg w-full shadow-2xl border-2 border-white relative"
      >
        <button
          className="absolute top-4 right-4 flex items-center justify-center w-12 h-12 bg-black/30 backdrop-blur-lg border-2 border-white rounded-20 text-white hover:text-black hover:bg-white text-3xl font-bold transition-all"
          onClick={isSubmitting ? undefined : onClose}
          type="button"
          aria-label="Close"
          disabled={isSubmitting}
        >
          &times;
        </button>
        <h3 className="text-2xl font-bold mb-6 text-white">Upload Document</h3>
        <div className="flex flex-col gap-4">
          <input
            className="bg-black/20 backdrop-blur-lg text-white border-2 border-white rounded px-4 py-2 placeholder-white"
            placeholder="NFT Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={64}
            disabled={!isEditing}
          />
          <div className="flex justify-between text-xs text-white px-1">
            <span>{name.length}/64</span>
          </div>
          <textarea
            className="bg-black/20 backdrop-blur-lg text-white border-2 border-white rounded px-4 py-2 placeholder-white"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={512}
            rows={3}
            disabled={!isEditing}
          />
          <div className="flex justify-between text-xs text-white px-1">
            <span>{description.length}/512</span>
          </div>
          {/* Drag & drop or upload image (optional) */}
          <div
            className={`bg-black/20 backdrop-blur-lg rounded px-4 py-4 flex flex-col items-center border-2 border-dashed border-white cursor-pointer hover:border-pink-400 transition ${!isEditing ? 'opacity-60 pointer-events-none' : ''}`}
            onDrop={isEditing ? handleImageDrop : undefined}
            onDragOver={isEditing ? (e) => e.preventDefault() : undefined}
            onClick={isEditing ? () => imageInputRef.current?.click() : undefined}
          >
            <input
              type="file"
              accept="image/*"
              ref={imageInputRef}
              style={{ display: 'none' }}
              onChange={handleImageChange}
              disabled={!isEditing}
            />
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-24 h-24 object-cover rounded mb-2"
              />
            ) : (
              <span className="text-white">Drag & drop or click to upload image (optional)</span>
            )}
            {imageFile && <span className="text-xs text-white">{imageFile.name}</span>}
          </div>
          {/* Drag & drop or upload main file (mandatory) */}
          <div
            className={`bg-black/20 backdrop-blur-lg rounded px-4 py-6 flex flex-col items-center border-2 border-dashed border-pink-500 cursor-pointer hover:border-pink-400 transition ${!isEditing ? 'opacity-60 pointer-events-none' : ''}`}
            onDrop={isEditing ? handleFileDrop : undefined}
            onDragOver={isEditing ? (e) => e.preventDefault() : undefined}
            onClick={isEditing ? () => fileInputRef.current?.click() : undefined}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleMainFileChange}
              required
              disabled={!isEditing}
            />
            {mainFile ? (
              <span className="text-pink-400 font-semibold">{mainFileName}</span>
            ) : (
              <span className="text-white">Drag & drop or click to upload file (required)</span>
            )}
          </div>
          <input
            className="bg-black/20 backdrop-blur-lg text-white border-2 border-white rounded px-4 py-2 placeholder-white"
            placeholder="Price in USD"
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            disabled={!isEditing}
          />
          <input
            className="bg-black/20 backdrop-blur-lg text-white border-2 border-white rounded px-4 py-2 placeholder-white"
            placeholder="File Type (e.g. .jpg, .pdf)"
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            required
            disabled={!isEditing}
          />
          <input
            className="bg-black/20 backdrop-blur-lg text-white border-2 border-white rounded px-4 py-2 placeholder-white"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            disabled={!isEditing}
          />
          {/* Secret input with visibility toggle and auto-generate */}
          <div className="relative flex items-center">
            <input
              className="bg-black/20 backdrop-blur-lg text-white border-2 border-white rounded px-4 py-2 pr-24 w-full placeholder-white"
              placeholder="Secret (used for encryption)"
              type={showSecret ? 'text' : 'password'}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required
              maxLength={64}
              disabled={!isEditing}
            />
            {/* Eye on/off button */}
            <button
              type="button"
              className="absolute right-12 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 text-zinc-300 hover:bg-transparent hover:text-white transition border-0 focus:outline-none"
              onClick={() => setShowSecret((v) => !v)}
              tabIndex={-1}
              disabled={!isEditing}
              aria-label={showSecret ? 'Hide secret' : 'Show secret'}
            >
              {showSecret ? (
                // Eye-off icon (SVG, white)
                <svg
                  className="w-6 h-6"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3.933 13.909A4.357 4.357 0 0 1 3 12c0-1 4-6 9-6m7.6 3.8A5.068 5.068 0 0 1 21 12c0 1-3 6-9 6-.314 0-.62-.014-.918-.04M5 19 19 5m-4 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
              ) : (
                // Eye icon (SVG, white)
                <svg
                  className="w-6 h-6"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    d="M21 12c0 1.2-4.03 6-9 6s-9-4.8-9-6c0-1.2 4.03-6 9-6s9 4.8 9 6Z"
                  />
                  <path
                    stroke="currentColor"
                    strokeWidth="2"
                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                  />
                </svg>
              )}
            </button>
            {/* Copy to clipboard button */}
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/10 text-zinc-300 hover:bg-transparent hover:text-white transition border-0 focus:outline-none"
              onClick={() => {
                navigator.clipboard.writeText(secret);
                alert('Secret copied to clipboard!');
              }}
              tabIndex={-1}
              disabled={!isEditing || !secret}
              aria-label="Copy secret"
            >
              {/* Clipboard icon (SVG, white) */}
              <svg
                className="w-6 h-6"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z"
                />
              </svg>
            </button>
          </div>
          <div className="flex justify-between text-xs text-white px-1">
            <span>{secret.length}/64</span>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            className="h-12 px-8 bg-black text-white border border-white rounded-full font-bold shadow transition-all text-lg hover:bg-white hover:text-black hover:border-black"
            onClick={() => setSecret(generateRandomSecret(32))}
            disabled={!isEditing}
          >
            Generate Secret
          </button>
          <button
            type="submit"
            className="h-12 px-8 bg-black text-white border border-white rounded-full font-bold shadow transition-all text-lg hover:bg-white hover:text-black hover:border-black"
            disabled={!isEditing || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
        {/* Success and error dialogs */}
        {isSuccess && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-fade-in">
            NFT uploaded successfully!
          </div>
        )}
        {isError && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-fade-in">
            {errorMsg}
          </div>
        )}
      </form>
    </div>
  );
};
