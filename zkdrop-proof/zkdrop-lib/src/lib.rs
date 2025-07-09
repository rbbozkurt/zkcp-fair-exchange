#![no_std]

extern crate alloc;

use alloc::string::String;
use alloc::vec::Vec;
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
