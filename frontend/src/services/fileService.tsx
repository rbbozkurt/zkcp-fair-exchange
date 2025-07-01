import { PinataSDK } from 'pinata';

// Utility: Encrypt a file with a secret using AES-GCM (Web Crypto API)
const VITE_PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const VITE_PINATA_GATEWAY_URL = import.meta.env.VITE_PINATA_GATEWAY_URL;

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

const pinata = new PinataSDK({
  pinataJwt: VITE_PINATA_API_KEY!,
  pinataGateway: VITE_PINATA_GATEWAY_URL,
});

const uploadFileToPinata = async (file: File): Promise<string> => {
  try {
    const response = await pinata.upload.file(file);
    if (response.cid) {
      return `ipfs://${response.cid}`;
    } else {
      throw new Error('File upload failed, no IPFS hash returned');
    }
  } catch (error) {
    console.error('Error uploading file to Pinata:', error);
    throw new Error('Failed to upload file to IPFS');
  }
};

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
    const ipfsAddress = await uploadFileToPinata(encryptedFile);
    const imageIpfsAddress = data.image ? await uploadFileToPinata(data.image) : null;

    // Return the IPFS address of the uploaded file
    return {
      name: data.name,
      description: data.description,
      image: imageIpfsAddress,
      attributes: [
        {
          file_enc: ipfsAddress,
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
