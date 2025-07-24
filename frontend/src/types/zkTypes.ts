interface AesCtrDecryptionProofRequest {
  aes_key_hex: string; // AES-256 key, hex-encoded (64 hex chars → 32 bytes)
  iv_hex: string; // AES-CTR IV / counter, hex-encoded (32 hex chars → 16 bytes)
  plaintext_utf8: string; // Original UTF-8 plaintext (e.g., JSON or message)
  ciphertext_hex: string; // Ciphertext as hex-encoded string
}

interface RsaEncryptedAesKeyRequest {
  aes_key_hex: string; // AES-256 key, hex-encoded (64 hex chars → 32 bytes)
  rsa_pubkey_base64: string; // RSA public key (base64-encoded DER, 294 bytes for 2048-bit key)
  enc_aes_key_hex: string; // AES key encrypted with RSA public key (hex-encoded)
}

interface RsaEncryptAesKeyRequest {
  aes_key_hex: string; // AES-256 key, hex-encoded (64 hex chars → 32 bytes)
  rsa_pubkey_base64: string; // RSA public key (base64-encoded DER, 294 bytes for 2048-bit key)
}

export type { AesCtrDecryptionProofRequest, RsaEncryptedAesKeyRequest, RsaEncryptAesKeyRequest };
