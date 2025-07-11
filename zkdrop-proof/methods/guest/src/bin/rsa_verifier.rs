#![no_main]


use risc0_zkvm::guest::env;
use zkdrop_lib::types::RsaEncryptedAesKeyInput;
use zkdrop_lib::rsa::rsa_verify;
// 
risc0_zkvm::guest::entry!(main);


pub fn main() {
    // Receive input from host
    let input: RsaEncryptedAesKeyInput = env::read();

    // Verify RSA encryption of AES key
    let verification_output = rsa_verify(input);

    // Return result to host
    env::commit(&verification_output);
}
