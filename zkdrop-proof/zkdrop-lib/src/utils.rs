use risc0_zkvm::Receipt;
use bincode::serialize;
use base64::{engine::general_purpose, Engine as _};
use alloc::string::String;


pub fn receipt_to_base64(receipt: &Receipt) -> String {
    // Serialize the receipt to bytes
    let receipt_bytes = serialize(receipt).expect("Failed to serialize receipt");

    // Encode the bytes as base64
    general_purpose::STANDARD.encode(receipt_bytes)
}