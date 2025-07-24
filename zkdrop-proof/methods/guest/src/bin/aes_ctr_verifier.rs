#![no_main]

use risc0_zkvm::guest::env;

use zkdrop_lib::types::AesCtrDecryptionProofInput;
use zkdrop_lib::aes_ctr::aes_ctr_verify;

risc0_zkvm::guest::entry!(main);

pub fn main() {
    // Read input from host
    let input: AesCtrDecryptionProofInput = env::read();

    // Run AES-CTR verification
    let result = aes_ctr_verify(input);

    // Return result to host
    env::commit(&result);
}
