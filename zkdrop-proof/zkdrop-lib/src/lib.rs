#![no_std]

extern crate alloc;

use alloc::string::String;
use serde::{Deserialize, Serialize};

/// Inputs for AES-CTR decryption proof
#[derive(Debug, Serialize, Deserialize)]
pub struct AesCtrDecryptionProofInput {
    /// AES-256 key, hex-encoded (64 hex chars → 32 bytes)
    pub aes_key_hex: String,

    /// AES-CTR IV / counter, hex-encoded (32 hex chars → 16 bytes)
    pub iv_hex: String,

    /// Original UTF-8 plaintext (e.g., JSON or message)
    pub plaintext_utf8: String,

    /// Ciphertext as hex-encoded string
    pub ciphertext_hex: String,
}

/// Inputs for verifying RSA encryption of AES key
#[derive(Debug, Serialize, Deserialize)]
pub struct RsaEncryptedAesKeyInput {
    /// AES-256 key, hex-encoded (64 hex chars → 32 bytes)
    pub aes_key_hex: String,

    /// RSA public key (base64-encoded DER, 294 bytes for 2048-bit key)
    pub rsa_pubkey_base64: String,

    /// AES key encrypted with RSA public key (hex-encoded)
    pub enc_aes_key_hex: String,
}


/// Inputs for verifying RSA encryption of AES key
#[derive(Debug, Serialize, Deserialize)]
pub struct RsaEncryptAesKeyInput {
    /// AES-256 key, hex-encoded (64 hex chars → 32 bytes)
    pub aes_key_hex: String,

    /// RSA public key (base64-encoded DER, 294 bytes for 2048-bit key)
    pub rsa_pubkey_base64: String,

}

