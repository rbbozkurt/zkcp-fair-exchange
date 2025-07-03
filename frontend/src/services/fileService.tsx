import axios from 'axios';

// Utility: Encrypt a file with a secret using AES-GCM (Web Crypto API)
const VITE_PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const VITE_PINATA_SECRET_API_KEY = import.meta.env.VITE_PINATA_SECRET_API_KEY;

/*

interface NFTAttrs {
    owner: string; // Owner's address
    name: string; // Name of the NFT
    description: string; // Description of the NFT
    image?: string | null; // Optional image IPFS address
    attributes: {
        price_in_usd: number; // Price in USD
        ipfs_address: string; // IPFS address of the NFT
    }[];
}
    */

interface EncryptedFileResponse {
  name: string;
  description: string;
  image?: string | null;
  attributes: {
    file_enc: string; // IPFS address of the encrypted file
    file_type: string; // e.g., '.pdf', '.jpg'
    price_in_usd: number; // Price in USD
    category: string; // Category of the file
  }[];
}

// Remove PinataSDK usage and use axios + FormData for browser upload
export async function uploadFileToPinata(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
    maxContentLength: Infinity,
    headers: {
      'Content-Type': 'multipart/form-data',
      pinata_api_key: VITE_PINATA_API_KEY,
      pinata_secret_api_key: VITE_PINATA_SECRET_API_KEY,
    },
  });

  return res.data.IpfsHash;
}

export async function encryptAndUpload(data: {
  name: string;
  description: string;
  price_in_usd: number;
  file_type: string;
  category: string;
  secret: string;
  file: File;
  image?: File | null;
}): Promise<EncryptedFileResponse> {
  try {
    // Encrypt the file
    const encryptedFile = await encryptFileWithSecret(data.file, data.secret);

    // Upload the encrypted file to IPFS
    const ipfsHash = await uploadFileToPinata(encryptedFile);
    const imageIpfsHash = data.image ? await uploadFileToPinata(data.image) : null;

    // Return the IPFS address of the uploaded file
    return {
      name: data.name,
      description: data.description,
      image: imageIpfsHash,
      attributes: [
        {
          file_enc: ipfsHash,
          file_type: data.file_type,
          price_in_usd: data.price_in_usd,
          category: data.category,
        },
      ],
    };
  } catch (error) {
    console.error('Error in encryptAndUpload:', error);
    throw new Error('Failed to encrypt and upload file');
  }
}

export async function encryptFileWithSecret(file: File, secret: string): Promise<File> {
  const fileBuffer = await file.arrayBuffer();
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(secret.padEnd(32, '0').slice(0, 32)), // 256-bit key
    'AES-GCM',
    false,
    ['encrypt']
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    fileBuffer
  );
  // Prepend IV to encrypted data
  const encryptedBytes = new Uint8Array(encrypted);
  const result = new Uint8Array(iv.length + encryptedBytes.length);
  result.set(iv, 0);
  result.set(encryptedBytes, iv.length);

  // Return as a File object (with .enc extension)
  return new File([result], `${file.name}.enc`, { type: 'application/octet-stream' });
}

// Trivial change: This comment was added to test git commit functionality.
