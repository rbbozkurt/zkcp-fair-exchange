import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { UploadedDocument } from '../types/nftTypes';
import { SecretInputField } from './SecretField';
import keyService from '../services/keyService';
import encodingUtils from '../utils/encodingUtils';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const UploadModalStatusEnum = {
  EDITING: 'EDITING',
  SUBMITTING: 'SUBMITTING',
  SUBMITTED: 'SUBMITTED',
  ON_SUCCESS: 'ON_SUCCESS',
  ON_WAITING_FOR_DOWNLOAD: 'WAITING_FOR_DOWNLOAD',
  ON_ERROR: 'ON_ERROR',
} as const;

export type UploadModalStatus = (typeof UploadModalStatusEnum)[keyof typeof UploadModalStatusEnum];

export interface UploadModalProps {
  open: boolean;
  status: UploadModalStatus;
  message: string;
  onClose: () => void;
  onSubmit: (uploadedDocument: UploadedDocument) => void;
}

interface UploadFormState {
  name: string;
  description: string;
  image?: File | null;
  file?: File | null;
  price_in_usd: number;
  type: string;
  category: string;
  secret: string;
  iv: string;
}

interface UploadFormProps {
  onSubmit: (data: UploadedDocument) => void;
  onClose: () => void;
}

const UploadForm: React.FC<UploadFormProps> = ({ onSubmit, onClose }) => {
  const [formState, setFormState] = useState<UploadFormState>({
    name: '',
    description: '',
    image: null,
    file: null,
    price_in_usd: 0,
    type: '',
    category: '',
    secret: '',
    iv: '',
  });

  useEffect(() => {
    handleGenerateAesKey();
    handleGenerateIv();
  }, []);
  // Refs for file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.file) {
      alert('Please upload a file to mint as NFT.');
      return;
    }
    if (!formState.secret) {
      alert('Please generate a secret key for encryption.');
      return;
    }
    if (!formState.iv) {
      alert('Please generate an initialization vector (IV).');
      return;
    }

    const uploadData: UploadedDocument = {
      name: formState.name,
      description: formState.description,
      price_in_usd: formState.price_in_usd,
      type: formState.type,
      category: formState.category,
      secret: formState.secret,
      file: formState.file,
      image: formState.image ?? undefined,
      iv: formState.iv,
    };
    onSubmit(uploadData);
  };

  const handleTextChange =
    <K extends keyof UploadFormState>(field: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
    setFormState((prev) => ({
      ...prev,
      price_in_usd: value,
    }));
  };

  // File handlers
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
      const detectedType = extMatch ? `.${extMatch[1]}` : file.type || 'application/octet-stream';

      setFormState((prev) => ({
        ...prev,
        file: file,
        type: detectedType,
      }));
    }
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setFormState((prev) => ({
        ...prev,
        image: file,
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormState((prev) => ({
        ...prev,
        image: file,
      }));
    }
  };

  const handleMainFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
      const detectedType = extMatch ? `.${extMatch[1]}` : file.type || 'application/octet-stream';

      setFormState((prev) => ({
        ...prev,
        file: file,
        type: detectedType,
      }));
    }
  };

  // Crypto functions
  const handleGenerateAesKey = async () => {
    try {
      const aesKey = await keyService.generateAesKey();
      const aesKeyHex = await encodingUtils.aesKeyToHex(aesKey);
      setFormState((prev) => ({
        ...prev,
        secret: aesKeyHex,
      }));
    } catch (error) {
      console.error('Failed to generate AES key:', error);
      alert('Failed to generate encryption key. Please try again.');
    }
  };

  const handleGenerateIv = async () => {
    try {
      const iv = await keyService.generateRandomIv();
      const ivHex = await encodingUtils.toHex(iv);
      setFormState((prev) => ({
        ...prev,
        iv: ivHex,
      }));
    } catch (error) {
      console.error('Failed to generate IV:', error);
      alert('Failed to generate initialization vector. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <form
        onSubmit={handleSubmit}
        className="bg-black/20 backdrop-blur-lg rounded-2xl p-8 max-w-lg w-full shadow-2xl border-2 border-white relative"
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 flex items-center justify-center w-12 h-12 bg-black/30 backdrop-blur-lg border-2 border-white rounded-20 text-white hover:text-black hover:bg-white text-3xl font-bold transition-all"
          onClick={onClose}
          type="button"
          aria-label="Close"
        >
          &times;
        </button>

        <h3 className="text-2xl font-bold mb-6 text-white">Upload Document</h3>

        <div className="flex flex-col gap-4">
          {/* NFT Name */}
          <input
            className="bg-black/20 backdrop-blur-lg text-white border-2 border-white rounded px-4 py-2 placeholder-white"
            placeholder="NFT Name"
            value={formState.name}
            onChange={handleTextChange('name')}
            required
            maxLength={64}
          />
          <div className="flex justify-between text-xs text-white px-1">
            <span>{formState.name.length}/64</span>
          </div>

          {/* Description */}
          <textarea
            className="bg-black/20 backdrop-blur-lg text-white border-2 border-white rounded px-4 py-2 placeholder-white"
            placeholder="Description"
            value={formState.description}
            onChange={handleTextChange('description')}
            required
            maxLength={512}
            rows={3}
          />
          <div className="flex justify-between text-xs text-white px-1">
            <span>{formState.description.length}/512</span>
          </div>

          {/* Image upload */}
          <div
            className="bg-black/20 backdrop-blur-lg rounded px-4 py-4 flex flex-col items-center border-2 border-dashed border-white cursor-pointer hover:border-pink-400 transition"
            onDrop={handleImageDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => imageInputRef.current?.click()}
          >
            <input
              type="file"
              accept="image/*"
              ref={imageInputRef}
              style={{ display: 'none' }}
              onChange={handleImageChange}
            />
            {formState.image ? (
              <span className="text-white">{formState.image.name}</span>
            ) : (
              <span className="text-white">Drag & drop or click to upload image (optional)</span>
            )}
          </div>

          {/* Main file upload */}
          <div
            className="bg-black/20 backdrop-blur-lg rounded px-4 py-6 flex flex-col items-center border-2 border-dashed border-pink-500 cursor-pointer hover:border-pink-400 transition"
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleMainFileChange}
              required
            />
            {formState.file ? (
              <span className="text-pink-400 font-semibold">{formState.file.name}</span>
            ) : (
              <span className="text-white">Drag & drop or click to upload file (required)</span>
            )}
          </div>

          {/* Price */}
          <input
            className="bg-black/20 backdrop-blur-lg text-white border-2 border-white rounded px-4 py-2 placeholder-white"
            placeholder="Price in USD"
            type="number"
            min="0"
            step="0.01"
            value={formState.price_in_usd || ''}
            onChange={handleNumberChange}
            required
          />

          {/* Category */}
          <input
            className="bg-black/20 backdrop-blur-lg text-white border-2 border-white rounded px-4 py-2 placeholder-white"
            placeholder="Category"
            value={formState.category}
            onChange={handleTextChange('category')}
            required
          />

          {/* Secret input field */}
          <SecretInputField
            value={formState.secret}
            onGenerateClicked={handleGenerateAesKey}
            placeholder="Secret (used for encryption)"
            name="secret"
            maxLength={64}
          />

          {/* IV input field - new */}
          <SecretInputField
            value={formState.iv}
            onGenerateClicked={handleGenerateIv}
            placeholder="Initialization Vector (IV)"
            name="iv"
            maxLength={32}
          />
        </div>

        {/* Form actions */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="submit"
            className="h-12 px-8 bg-black text-white border border-white rounded-full font-bold shadow transition-all text-lg hover:bg-white hover:text-black hover:border-black"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
};

interface UploadInfoProps {
  message: string;
  messageType?: 'success' | 'error';
  onClose: () => void;
}

const UploadInfo: React.FC<UploadInfoProps> = ({ message, messageType = 'success', onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div
        className={`bg-black/20 backdrop-blur-lg rounded-2xl p-8 max-w-lg w-full shadow-2xl border-2 ${messageType === 'error' ? 'border-red-500' : 'border-white'} relative`}
      >
        <p className="text-white mb-4">{message}</p>
        <button
          className="absolute top-4 right-4 flex items-center justify-center w-12 h-12 bg-black/30 backdrop-blur-lg border-2 border-white rounded-full text-white hover:text-black hover:bg-white text-3xl font-bold transition-all"
          onClick={onClose}
          type="button"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

export const UploadModal: React.FC<UploadModalProps> = ({
  open,
  status,
  message,
  onClose,
  onSubmit,
}: UploadModalProps) => {
  const [secretAndIV, setSecretAndIV] = useState<[string, string]>(['', '']);
  const [secretName, setSecretName] = useState<string>('');
  const handleSubmit = (data: UploadedDocument) => {
    setSecretAndIV([data.secret, data.iv]);
    setSecretName(data.name);
    onSubmit(data);
  };

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);
  if (!open) return null;

  return (
    <div>
      {status === UploadModalStatusEnum.EDITING && (
        <UploadForm onClose={handleClose} onSubmit={handleSubmit} />
      )}
      {status === UploadModalStatusEnum.SUBMITTING && (
        <UploadInfo message={message} onClose={handleClose} />
      )}
      {status === UploadModalStatusEnum.ON_SUCCESS && (
        <UploadInfo message={message} messageType="success" onClose={handleClose} />
      )}
      {status === UploadModalStatusEnum.ON_ERROR && (
        <UploadInfo message={message} messageType="error" onClose={handleClose} />
      )}
      {status === UploadModalStatusEnum.ON_WAITING_FOR_DOWNLOAD && (
        <DownloadSecrets
          secretFileName={`${secretName}_secret`}
          ivFileName={`${secretName}_iv`}
          secret={secretAndIV[0]}
          iv={secretAndIV[1]}
          onClose={handleClose}
        />
      )}
    </div>
  );
};

interface DownloadSecretsProps {
  secretFileName?: string;
  ivFileName?: string;
  secret: string;
  iv: string;
  onClose?: () => void;
}

// Rest of your imports...

export const DownloadSecrets: React.FC<DownloadSecretsProps> = ({
  secretFileName = 'encryption-key',
  ivFileName = 'initialization-vector',
  secret,
  iv,
  onClose,
}) => {
  const downloadFile = (content: string, fileName: string, extension: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-black/20 backdrop-blur-lg rounded-2xl p-8 max-w-lg w-full shadow-2xl border-2 border-white relative">
        {/* Close button */}
        {onClose && (
          <button
            className="absolute top-4 right-4 flex items-center justify-center w-12 h-12 bg-black/30 backdrop-blur-lg border-2 border-white rounded-20 text-white hover:text-black hover:bg-white text-3xl font-bold transition-all"
            onClick={onClose}
            type="button"
            aria-label="Close"
          >
            &times;
          </button>
        )}

        <h3 className="text-2xl font-bold mb-6 text-white">Download Encryption Keys</h3>

        <div className="flex flex-col gap-6">
          <div className="bg-black/40 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-white font-semibold">Secret Key</h4>
              <button
                onClick={() => downloadFile(secret, secretFileName, 'key')}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm hover:from-pink-600 hover:to-purple-600 transition-all flex items-center gap-2"
              >
                Download
                <ArrowDownTrayIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-white/80 bg-black/30 p-2 rounded text-sm font-mono break-all">
              {secret}
            </p>
            <p className="text-xs text-white/60 mt-2">
              This is your encryption key. Keep it safe and secure.
            </p>
          </div>

          <div className="bg-black/40 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-white font-semibold">Initialization Vector (IV)</h4>
              <button
                onClick={() => downloadFile(iv, ivFileName, 'iv')}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm hover:from-pink-600 hover:to-purple-600 transition-all flex items-center gap-2"
              >
                Download
                <ArrowDownTrayIcon className="w-5 h-5" />
              </button>
            </div>
            <p className="text-white/80 bg-black/30 p-2 rounded text-sm font-mono break-all">
              {iv}
            </p>
            <p className="text-xs text-white/60 mt-2">
              This IV is required along with the secret key for decryption.
            </p>
          </div>

          <div className="bg-yellow-600/20 border border-yellow-500/50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <span className="text-yellow-500 text-xl">⚠️</span>
              <p className="text-white/90 text-sm">
                <strong>Important:</strong> Store these files securely. Anyone with access to both
                files can decrypt your data. You will need both files to access your encrypted
                content later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
