#![no_main]


use risc0_zkvm::guest::env;
use zkdrop_lib::types::RsaEncryptAesKeyInput;
use zkdrop_lib::rsa::rsa_encrypt;
// Import the encryption logic from the crate root
risc0_zkvm::guest::entry!(main);

pub fn main() {
    // Receive input from host
    let input: RsaEncryptAesKeyInput = env::read();

    // Perform RSA encryption of AES key
    let encryption_output = rsa_encrypt(input);

    // Return result to host
    env::commit(&encryption_output);
}
