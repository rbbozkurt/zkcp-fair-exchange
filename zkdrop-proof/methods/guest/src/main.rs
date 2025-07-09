
use risc0_zkvm::guest::env;
use aes::Aes256;
use ctr::cipher::{KeyIvInit, StreamCipher}; // AES-CTR trait
use hex::{decode, encode};

type Aes256Ctr = ctr::Ctr128BE<Aes256>; // uses 128-bit (16-byte) IV, which you're already using
use zkdrop_lib::AesCtrDecryptionProofInput;
pub fn main() {
    // Receive input from host
    let input: AesCtrDecryptionProofInput = env::read();

    // Convert hex fields to binary
    let key = decode(&input.aes_key_hex).expect("Invalid AES key hex");
    let iv = decode(&input.iv_hex).expect("Invalid IV hex");
    let ciphertext_expected = decode(&input.ciphertext_hex).expect("Invalid ciphertext hex");

    // Convert plaintext to bytes
    let plaintext_bytes = input.plaintext_utf8.as_bytes();

    // Encrypt using AES-CTR
    let mut cipher = Aes256Ctr::new_from_slices(&key, &iv).expect("Invalid key/iv");
    let mut ciphertext = plaintext_bytes.to_vec();
    cipher.apply_keystream(&mut ciphertext);

    // Compare ciphertexts
    if ciphertext == ciphertext_expected {
        env::commit(&String::from("✅ Ciphertext matches AES-CTR encryption"));
    } else {
        env::commit(&String::from("❌ Ciphertext mismatch"));
    }
}
