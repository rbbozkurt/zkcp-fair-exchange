import React, { useState, useRef } from 'react';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any, done: (success: boolean, errorMsg?: string) => void) => void;
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
        file_type: fileType,
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
        className="bg-gray-900 rounded-2xl p-8 max-w-lg w-full shadow-2xl border border-pink-500/40 relative"
      >
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-pink-400 text-2xl font-bold"
          onClick={isSubmitting ? undefined : onClose}
          type="button"
          aria-label="Close"
          disabled={isSubmitting}
        >
          &times;
        </button>
        <h3 className="text-2xl font-bold mb-6 text-pink-400">Upload Document</h3>
        <div className="flex flex-col gap-4">
          <input
            className="bg-gray-800 text-white rounded px-4 py-2"
            placeholder="NFT Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={64}
            disabled={!isEditing}
          />
          <div className="flex justify-between text-xs text-gray-500 px-1">
            <span>{name.length}/64</span>
          </div>
          <textarea
            className="bg-gray-800 text-white rounded px-4 py-2"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={512}
            rows={3}
            disabled={!isEditing}
          />
          <div className="flex justify-between text-xs text-gray-500 px-1">
            <span>{description.length}/512</span>
          </div>
          {/* Drag & drop or upload image (optional) */}
          <div
            className={`bg-gray-800 rounded px-4 py-4 flex flex-col items-center border-2 border-dashed border-gray-600 cursor-pointer hover:border-pink-400 transition ${!isEditing ? 'opacity-60 pointer-events-none' : ''}`}
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
              <span className="text-gray-400">Drag & drop or click to upload image (optional)</span>
            )}
            {imageFile && <span className="text-xs text-gray-400">{imageFile.name}</span>}
          </div>
          {/* Drag & drop or upload main file (mandatory) */}
          <div
            className={`bg-gray-800 rounded px-4 py-6 flex flex-col items-center border-2 border-dashed border-pink-500 cursor-pointer hover:border-pink-400 transition ${!isEditing ? 'opacity-60 pointer-events-none' : ''}`}
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
              <span className="text-gray-400">Drag & drop or click to upload file (required)</span>
            )}
          </div>
          <input
            className="bg-gray-800 text-white rounded px-4 py-2"
            placeholder="Price in USD"
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            disabled={!isEditing}
          />
          <input
            className="bg-gray-800 text-white rounded px-4 py-2"
            placeholder="File Type (e.g. .jpg, .pdf)"
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            required
            disabled={!isEditing}
          />
          <input
            className="bg-gray-800 text-white rounded px-4 py-2"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            disabled={!isEditing}
          />
          {/* Secret input with visibility toggle and auto-generate */}
          <div className="relative flex items-center">
            <input
              className="bg-gray-800 text-white rounded px-4 py-2 pr-28 w-full"
              placeholder="Secret (used for encryption)"
              type={showSecret ? 'text' : 'password'}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              required
              maxLength={64}
              disabled={!isEditing}
            />
            <button
              type="button"
              className="absolute right-20 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-400"
              onClick={() => setShowSecret((v) => !v)}
              tabIndex={-1}
              disabled={!isEditing}
            >
              {showSecret ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.956 9.956 0 012.293-3.95m3.25-2.6A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.973 9.973 0 01-4.043 5.197M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3l18 18"
                  />
                </svg>
              )}
            </button>
            <button
              type="button"
              className="absolute right-0 top-1/2 -translate-y-1/2 text-xs bg-pink-500 hover:bg-pink-600 text-white rounded-full px-3 py-1 font-bold transition-all ml-2"
              onClick={() => setSecret(generateRandomSecret(32))}
              tabIndex={-1}
              disabled={!isEditing}
            >
              Generate
            </button>
          </div>
          <div className="flex justify-between text-xs text-gray-500 px-1">
            <span>{secret.length}/64</span>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            className="h-12 px-6 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-full shadow transition-all text-lg"
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
