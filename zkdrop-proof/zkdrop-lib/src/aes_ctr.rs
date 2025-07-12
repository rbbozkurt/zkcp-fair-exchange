
use aes::Aes256;
use ctr::cipher::{KeyIvInit, StreamCipher}; // AES-CTR trait
use hex::{decode};
use alloc::string::String;

type Aes256Ctr = ctr::Ctr128BE<Aes256>; // uses 128-bit (16-byte) IV, which you're already using
use crate::types::AesCtrDecryptionProofInput;

pub fn aes_ctr_verify(
    input : AesCtrDecryptionProofInput,
) -> (bool, String) {
    // Convert hex fields to binary
    let key = match decode(&input.aes_key_hex) {
        Ok(k) => k,
        Err(_) => return (false, String::from("Invalid AES key hex"))
    };
    
    let iv = match decode(&input.iv_hex) {
        Ok(i) => i,
        Err(_) => return (false, String::from("Invalid IV hex"))
    };
    
    let ciphertext_expected = match decode(&input.ciphertext_hex) {
        Ok(c) => c,
        Err(_) => return (false, String::from("Invalid ciphertext hex"))
    };

    // Convert plaintext to bytes
    let plaintext_bytes = input.plaintext_utf8.as_bytes();

    // Encrypt using AES-CTR
    let mut cipher = match Aes256Ctr::new_from_slices(&key, &iv) {
        Ok(c) => c,
        Err(_) => return (false, String::from("Invalid key or IV length"))
    };
    
    let mut ciphertext = plaintext_bytes.to_vec();
    cipher.apply_keystream(&mut ciphertext);

    // Compare ciphertexts
    if ciphertext == ciphertext_expected {
        return (true, String::from("✅ Ciphertext matches AES-CTR encryption"))
    } else {
        return (false, String::from("❌ Ciphertext mismatch"))
    }
}