
use risc0_zkvm::guest::env;
mod aes_verifier;
use aes::Aes256;
use ctr::cipher::{KeyIvInit, StreamCipher}; // AES-CTR trait
use hex::{decode, encode};
use crate::aes_verifier::aes_ctr_verifier;
type Aes256Ctr = ctr::Ctr128BE<Aes256>; // uses 128-bit (16-byte) IV, which you're already using
use zkdrop_lib::AesCtrDecryptionProofInput;
pub fn main() {
    // Receive input from host
    let input: AesCtrDecryptionProofInput = env::read();

    // Convert hex fields to binary
    let (is_valid, message) = aes_ctr_verifier(input);
    env::commit(&message);
}
