const toHex = (buffer: ArrayBuffer | Uint8Array): string => {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const toBase64 = (buffer: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));

const base64ToArrayBuffer = (base64: string): ArrayBuffer =>
  Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;

const hexToArrayBuffer = (hex: string): ArrayBuffer =>
  new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))).buffer;

// AES Key Utilities
async function aesKeyToRaw(aesKey: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.exportKey('raw', aesKey);
}

async function aesKeyToHex(aesKey: CryptoKey): Promise<string> {
  const raw = await aesKeyToRaw(aesKey);
  return toHex(raw);
}

async function hexToAesKey(hex: string): Promise<CryptoKey> {
  const raw = hexToArrayBuffer(hex);
  return await crypto.subtle.importKey('raw', raw, { name: 'AES-CTR', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
}

async function hexToUInt8Array(hex: string): Promise<Uint8Array> {
  const buffer = hexToArrayBuffer(hex);
  return new Uint8Array(buffer);
}

// RSA Key Export/Import
async function publicKeyToDer(key: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.exportKey('spki', key);
}

async function privateKeyToDer(key: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.exportKey('pkcs8', key);
}

async function privateKeyToPem(key: CryptoKey): Promise<string> {
  const der = await privateKeyToDer(key);
  const base64 = toBase64(der);
  return `-----BEGIN PRIVATE KEY-----\n${base64}\n-----END PRIVATE KEY-----`;
}

async function publicKeyToPem(key: CryptoKey): Promise<string> {
  const der = await publicKeyToDer(key);
  const base64 = toBase64(der);
  return `-----BEGIN PUBLIC KEY-----\n${base64}\n-----END PUBLIC KEY-----`;
}

async function importPublicKeyFromPem(pem: string): Promise<CryptoKey> {
  const base64 = pem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n/g, '');
  const der = base64ToArrayBuffer(base64);
  return await importPublicKeyFromDer(der);
}

async function importPrivateKeyFromPem(pem: string): Promise<CryptoKey> {
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\n/g, '');
  const der = base64ToArrayBuffer(base64);
  return await importPrivateKeyFromDer(der);
}

async function importPublicKeyFromDer(der: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey('spki', der, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, [
    'encrypt',
  ]);
}

async function importPrivateKeyFromDer(der: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey('pkcs8', der, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, [
    'decrypt',
  ]);
}

// Public Key Format Conversions
async function derToBase64(der: ArrayBuffer): Promise<string> {
  return toBase64(der);
}

async function base64ToPublicKey(base64: string): Promise<CryptoKey> {
  const der = base64ToArrayBuffer(base64);
  return await importPublicKeyFromDer(der);
}

// Exports
export default {
  toHex,
  toBase64,
  base64ToArrayBuffer,
  hexToArrayBuffer,
  aesKeyToRaw,
  aesKeyToHex,
  hexToAesKey,
  hexToUInt8Array,
  publicKeyToDer,
  privateKeyToDer,
  importPublicKeyFromDer,
  importPrivateKeyFromDer,
  derToBase64,
  base64ToPublicKey,
  publicKeyToPem,
  privateKeyToPem,
  importPublicKeyFromPem,
  importPrivateKeyFromPem,
};
