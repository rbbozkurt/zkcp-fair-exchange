use axum::{extract::Query, Json};
use crate::zkvm;
use zkdrop_lib::types::{AesCtrDecryptionProofInput, AesCtrDecryptionProofOutput};
use super::{ProveParams, resolve_mode};

/// Response structure returned by the AES-CTR decryption proof endpoint.
///
/// - `output`: The decoded result of AES-CTR decryption verification.
/// - `receipt_base64`: The serialized ZK proof receipt in base64 encoding.
#[derive(serde::Deserialize, serde::Serialize)]
pub struct AesCtrDecryptionProofResponse {
    pub output: AesCtrDecryptionProofOutput,
    pub receipt_base64: String,
}

/// Handle AES-CTR decryption proof verification request.
///
/// This handler receives a `AesCtrDecryptionProofInput` JSON body and an optional `prove_mode`
/// query parameter to select proof generation backend (`local`, `bonsai`, or `bonsai-snark`).
/// It runs the proof using the selected mode, decodes the result, and returns the output along
/// with the serialized ZK proof receipt in base64 format.
///
/// ### Example request:
/// `POST /aes-verify?prove_mode=local`
///
/// ```json
/// {
///   "aes_key_hex":"de15a7f6957c3eb9a86689106a98e3bea6f4b7222a63aa0ba7afda647d2ff98d",
///   "iv_hex": "01020300000000000000000000000000",
///   "plaintext_utf8": "example fileeee ! ",
///   "ciphertext_hex": "ef8d7b4abcaea121953432bd58aa69589312"
/// }
/// ```
///
/// ### Example response:
/// ```json
/// {
///   "output": {
///     "is_valid": true,
///     "message": "AES decryption successful"
///   },
///   "receipt_base64": "H4sIAAAAAAAA..."
/// }
/// ```
pub async fn handle_verify(
    Query(params): Query<ProveParams>,
    Json(payload): Json<AesCtrDecryptionProofInput>,
) -> Json<AesCtrDecryptionProofResponse> {
    println!("[AES-Verify] Received request ");

    let mode = resolve_mode(params.prove_mode.as_deref());
    println!("[AES-Verify] Resolved proving mode: {:?}", mode);

    let receipt = zkvm::run_aes_verify(payload, mode).unwrap();
    println!("[AES-Verify] Proof successfully generated.");

    let output: AesCtrDecryptionProofOutput = receipt.journal.decode().unwrap();
    println!("[AES-Verify] Output decoded: is_valid = {}, message = {}",
             output.is_valid, output.message);

    let receipt_base64 = zkdrop_lib::utils::receipt_to_base64(&receipt);
    println!("[AES-Verify] Receipt serialized to base64 ({} bytes).", receipt_base64.len());

    Json(AesCtrDecryptionProofResponse { output, receipt_base64 })
}
