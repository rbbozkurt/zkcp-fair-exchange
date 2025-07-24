import encodingUtils from '../utils/encodingUtils';

async function generateAesKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey({ name: 'AES-CTR', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
}

async function generateRandomIv(): Promise<Uint8Array> {
  // Generate a 16-byte (128-bit) random IV for AES-CTR
  return crypto.getRandomValues(new Uint8Array(16));
}

async function generateRsaKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
}

async function encryptWithRsa(data: ArrayBuffer, rsaKey: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, rsaKey, data);
}

async function decryptWithRsa(encryptedData: ArrayBuffer, rsaKey: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, rsaKey, encryptedData);
}

async function decryptWithRsaToHex(encryptedData: ArrayBuffer, rsaKey: CryptoKey): Promise<string> {
  const decryptedData = await decryptWithRsa(encryptedData, rsaKey);
  return encodingUtils.toHex(decryptedData);
}

async function encryptWithRsaToHex(data: ArrayBuffer, rsaKey: CryptoKey): Promise<string> {
  const encryptedData = await encryptWithRsa(data, rsaKey);
  return encodingUtils.toHex(encryptedData);
}

async function encryptAesKeyWithRsaToHex(aesKey: CryptoKey, rsaKey: CryptoKey): Promise<string> {
  return await encodingUtils.toHex(await encryptAesKeyWithRsa(aesKey, rsaKey));
}

async function encryptAesKeyWithRsa(aesKey: CryptoKey, rsaKey: CryptoKey): Promise<ArrayBuffer> {
  const rawAesKey = await encodingUtils.aesKeyToRaw(aesKey);
  return await encryptWithRsa(rawAesKey, rsaKey);
}

async function encryptBufferWithAesKey(
  buffer: ArrayBuffer,
  aesKey: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  return await crypto.subtle.encrypt({ name: 'AES-CTR', counter: iv, length: 64 }, aesKey, buffer);
}

async function encryptBufferWithAesKeyToUint8Array(
  buffer: ArrayBuffer,
  aesKey: CryptoKey,
  iv: Uint8Array
): Promise<Uint8Array> {
  const encryptedBuffer = await encryptBufferWithAesKey(buffer, aesKey, iv);
  return new Uint8Array(encryptedBuffer);
}

async function encryptBufferWithAesKeyUint8ArrayToHex(
  buffer: ArrayBuffer,
  aesKey: CryptoKey,
  iv: Uint8Array
): Promise<string> {
  const encryptedBuffer = await encryptBufferWithAesKeyToUint8Array(buffer, aesKey, iv);
  return encodingUtils.toHex(encryptedBuffer);
}

async function decryptBufferWithAesKey(
  encryptedBuffer: ArrayBuffer,
  aesKey: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  return await crypto.subtle.decrypt(
    { name: 'AES-CTR', counter: iv, length: 64 },
    aesKey,
    encryptedBuffer
  );
}

async function decryptBufferWithAesKeyToUint8Array(
  encryptedBuffer: ArrayBuffer,
  aesKey: CryptoKey,
  iv: Uint8Array
): Promise<Uint8Array> {
  const decryptedBuffer = await decryptBufferWithAesKey(encryptedBuffer, aesKey, iv);
  return new Uint8Array(decryptedBuffer);
}

async function decryptBufferWithAesKeyUint8ArrayToHex(
  encryptedBuffer: ArrayBuffer,
  aesKey: CryptoKey,
  iv: Uint8Array
): Promise<string> {
  const decryptedBuffer = await decryptBufferWithAesKeyToUint8Array(encryptedBuffer, aesKey, iv);
  return encodingUtils.toHex(decryptedBuffer);
}

export default {
  generateAesKey,
  generateRsaKeyPair,
  encryptWithRsa,
  encryptWithRsaToHex,
  encryptAesKeyWithRsa,
  encryptAesKeyWithRsaToHex,
  encryptBufferWithAesKeyToUint8Array,
  encryptBufferWithAesKeyUint8ArrayToHex,
  decryptWithRsa,
  decryptWithRsaToHex,
  generateRandomIv,
  decryptBufferWithAesKey,
  decryptBufferWithAesKeyToUint8Array,
  decryptBufferWithAesKeyUint8ArrayToHex,
};
