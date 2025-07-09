import axios from 'axios';
import type { UploadedDocument, EncryptedFileResponse } from '../types/nftTypes';
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

export async function encryptAndUpload(
  data: UploadedDocument,
  owner: string
): Promise<EncryptedFileResponse> {
  try {
    // Encrypt the file
    const encryptedFile = await encryptFileWithSecret(data.file, data.secret);

    // Upload the encrypted file to IPFS
    const ipfsHash = await uploadFileToPinata(encryptedFile);
    const imageIpfsHash = data.image ? await uploadFileToPinata(data.image) : null;
    const toBeMintedNFT = {
      owner: owner, // Owner should be set by the caller or after minting
      name: data.name,
      description: data.description,
      image: imageIpfsHash || '',
      attributes: [
        { trait_type: 'file_enc', value: ipfsHash },
        { trait_type: 'file_type', value: data.type },
        { trait_type: 'price_in_usd', value: data.price_in_usd },
        { trait_type: 'category', value: data.category },
      ],
    };
    //upload toBeMintedNFT to IPFS
    const uploadedNFTHash = await uploadFileToPinata(
      new File([JSON.stringify(toBeMintedNFT)], 'metadata.json', { type: 'application/json' })
    );

    // Return the IPFS address of the uploaded file in ListingNFT (EncryptedFileResponse) format
    return {
      owner: owner, // Owner should be set by the caller or after minting
      name: data.name,
      description: data.description,
      image: imageIpfsHash || '',
      attributes: [
        { trait_type: 'price_in_usd', value: data.price_in_usd },
        { trait_type: 'ipfs_address', value: uploadedNFTHash },
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

  // debug, remove later
  const slicedSecret = secret.padEnd(32, '0').slice(0, 32);
  const encodedSecret = enc.encode(slicedSecret);

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

  // debug: log the data inputs and the generated variables
  console.log('File encryption completed:', {
    fileName: file.name,
    fileSize: file.size,
    secretLength: secret.length,
    slicedSecret: slicedSecret,
    encodedSecret: encodedSecret,
    ivLength: iv.length,
    iv: iv,
    encryptedDataLength: result.length,
  });

  // Return as a File object (with .enc extension)
  return new File([result], `${file.name}.enc`, { type: 'application/octet-stream' });
}

export async function decryptFileWithSecret(file: File, secret: string): Promise<File> {
  const fileBuffer = await file.arrayBuffer();
  const data = new Uint8Array(fileBuffer);

  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);

  const slicedSecret = secret.padEnd(32, '0').slice(0, 32);
  const encodedSecret = new TextEncoder().encode(slicedSecret);

  const keyMaterial = await window.crypto.subtle.importKey('raw', encodedSecret, 'AES-GCM', false, [
    'decrypt',
  ]);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      keyMaterial,
      ciphertext
    );

    // Return as a File object (with .dec extension)
    return new File([decryptedBuffer], file.name.replace(/\.enc$/, '.dec'), {
      type: 'application/octet-stream',
    });
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Invalid secret or corrupted file');
  }
}
