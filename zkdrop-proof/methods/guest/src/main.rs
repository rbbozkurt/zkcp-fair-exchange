
use risc0_zkvm::guest::env;
//mod aes_verifier;
mod rsa_verifier;
use aes::Aes256;
// use crate::aes_verifier::aes_ctr_verifier;
use crate::rsa_verifier::{rsa_verifier, rsa_encrypt};
type Aes256Ctr = ctr::Ctr128BE<Aes256>; // uses 128-bit (16-byte) IV, which you're already using
use zkdrop_lib::{RsaEncryptedAesKeyInput, RsaEncryptAesKeyInput};

pub fn main() {
    // Receive input from host
    let input: RsaEncryptAesKeyInput = env::read();

    // Convert hex fields to binary
    let (_is_valid, message, enc_aes_key_hex) = rsa_encrypt(input);
    env::commit(&enc_aes_key_hex);
}
