use methods::{ZKDROP_GUEST_ELF, ZKDROP_GUEST_ID};
use risc0_zkvm::{default_prover, ExecutorEnv};
use zkdrop_lib::AesCtrDecryptionProofInput;

use aes_gcm::{Aes256Gcm, Key, Nonce}; // AES-GCM 256
use aes_gcm::aead::{Aead, KeyInit};

use k256::ecdsa::{SigningKey, Signature, signature::Signer};
// use k256::EncodedPoint;
use rand_core::OsRng;
use rand;

fn main() {

     //let aes_ctr = AesCtrDecryptionProofInput {
    //    aes_key_hex: String::from("2f5b46817d69d453bb914bd36209d9bd84dbb0933b1d3f417b22517286827f13"),
    //    iv_hex: String::from("01020300000000000000000000000000"),
    //    plaintext_utf8: String::from("Hello world!"),
    //    ciphertext_hex: String::from("6297bcd5f5dafe88312968d9"),
    //};
    
    let aes_ctr = AesCtrDecryptionProofInput {
        aes_key_hex: String::from("2f5b46817d69d453bb914bd36209d9bd84dbb0933b1d3f417b22517286827f13"),
        iv_hex: String::from("01020300000000000000000000000000"),
        plaintext_utf8: String::from("Hello world!"),
        ciphertext_hex: String::from("6297bcd5f5dafe88312968d9"),
    };
   

    // Step 7: Create ExecutorEnv with input
    let env = ExecutorEnv::builder()
        .write(&aes_ctr)
        .unwrap()
        .build()
        .unwrap();

    // Step 8: Prove execution
    let prover = default_prover();
    let prove_info = prover.prove(env, ZKDROP_GUEST_ELF).unwrap();
    let receipt = prove_info.receipt;

    // Step 9: Decode guest journal output (bool)
    let output: String = receipt.journal.decode().unwrap();
    println!("Output: {}", output);

    // Step 10: Verify the receipt
    receipt.verify(ZKDROP_GUEST_ID).unwrap();
}
