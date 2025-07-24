use axum::{extract::Query, Json};
use crate::zkvm;
use zkdrop_lib::types::{
    RsaEncryptAesKeyInput, RsaEncryptedAesKeyInput,
    RsaEncryptAesKeyOutput, RsaEncryptedAesKeyOutput
};
use zkdrop_lib::utils::receipt_to_base64;
use risc0_zkvm::Receipt;

use super::{ProveParams, resolve_mode};

/// Response returned from RSA encryption endpoint
/// - `output`: contains the result of AES key encryption
/// - `receipt_base64`: base64-encoded receipt which can be verified client-side (e.g., in TypeScript)
#[derive(serde::Deserialize, serde::Serialize)]
pub struct RsaEncryptAesKeyResponse {
    pub output: RsaEncryptAesKeyOutput,
    pub receipt_base64: String,
}

/// Response returned from RSA verification endpoint
/// - `output`: contains validity status and decrypted AES key
/// - `receipt_base64`: base64-encoded receipt for verification
#[derive(serde::Deserialize, serde::Serialize)]
pub struct RsaEncryptedAesKeyResponse {
    pub output: RsaEncryptedAesKeyOutput,
    pub receipt_base64: String,
}

/// POST /rsa-encrypt?prove_mode=local|bonsai|bonsai_snark
/// 
/// ### Example Request Body:
/// ```json
/// {
///   "aes_key_hex": "09c40804a785de29d9e199df192549069fced35ab05058332da2c51318a034d0",
///   "rsa_pubkey_base64": "MIIBIjANBgkqhkiG9..."
/// }
/// ```
///
/// ### Example Logs:
/// ```text
/// [INFO] Proving with mode: Local
/// [INFO] Proof generated and receipt encoded to base64
/// [DEBUG] Encrypted AES key: 0e7ad82...
/// ```
///
/// ### Example `curl`:
/// ```bash
/// curl -X POST "http://localhost:8081/rsa-encrypt?prove_mode=local" \
///      -H "Content-Type: application/json" \
///      -d '{"aes_key_hex":"...", "rsa_pubkey_base64":"..."}'
/// ```
pub async fn handle_encrypt(
    Query(params): Query<ProveParams>,
    Json(payload): Json<RsaEncryptAesKeyInput>,
) -> Json<RsaEncryptAesKeyResponse> {
    println!("[RSA-Encrypt] Received request");

    let mode = resolve_mode(params.prove_mode.as_deref());
    println!("[RSA-Encrypt] Resolved proving mode: {:?}", mode);

    let receipt = zkvm::run_rsa_encrypt(payload, mode).unwrap();
    println!("[RSA-Encrypt] Proof generated successfully.");

    let output: RsaEncryptAesKeyOutput = receipt.journal.decode().unwrap();
    println!("[RSA-Encrypt] Output decoded from journal. Encrypted AES key: {}", output.enc_aes_key_hex);

    let receipt_base64 = receipt_to_base64(&receipt);
    println!("[RSA-Encrypt] Receipt serialized to base64 ({} bytes).", receipt_base64.len());

    Json(RsaEncryptAesKeyResponse { output, receipt_base64 })
}

/// POST /rsa-verify?prove_mode=local|bonsai|bonsai_snark
///
/// ### Example Request Body:
/// ```json
/// {
///     "aes_key_hex": "32ec9a3cfee00897de3704677830710ae8d9074b0d88851b3d656435cb6db2b0",
///     "rsa_pubkey_base64": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0z0Nf8AagvQqkT/baHDHYnt0frz/wnWIWDPTJGY2NXrnIDMuBHdBOFjVM3soPfr1nI8ZKjF0KOcGsCqn31gLcTblkQlzIfg7FfO+QVAywoY8wgvt2BKreQ+Fq8gzjhV/EAsJbqWnBoQj+fD0TXy+EZdP378UdePMxEPMWT3Ivao/2Myz2mmnoyVU2AGAhCeouGlgsIhcFfdQhqSF/DlkFlDvo7UKA8cDGZjHxGAzcajQqnAkBu2Wb2eOQXMeIKB3oKqI3AvpqNFpz5tq+y6y3vBhmRqZ+oUFnfQx9wG3nWtACgCksxNh0XZTs8ZSAXKwjKRAniW4EkTSt9AhV3ef4wIDAQAB",
///     "enc_aes_key_hex": "8655273e91ecb30a5d15cc3267df665c7e639941e25a2b4658ffba8f71dd388083df1f62b9ed5687d40c98485c9abded97f80fea456b67a5d4577268bb65c3038d0662c879465c32573790e462b44e3670fd578259d380b606067e0e55ce3dba3cdee6ba9156e4c9945f3bd9ad7ed9ce505ad87e87c5e808d4cbd21aeaea6f6f787c093424a5c913efbcde17d82ceeb850394b2744535df5e1eac9d7bfec6b0f3e685c866a6237c86892dc1335491e9de984af56b58e4ef118758451953e37f0b404cdd06b77f68fa669556864104f1c52ef9a322df3e25f19b655adbcb153815621244a0b14671f12a8b272b90dbaefd1e5a35bbb14be776562170c5d560942"
/// }
/// ```
///
/// ### Example Logs:
/// ```text
/// [INFO] Verifying proof using Bonsai
/// [DEBUG] RSA decryption successful, output matches
/// ```
///
/// ### Example `curl`:
/// ```bash
/// curl -X POST "http://localhost:8081/rsa-verify?prove_mode=local" \
///      -H "Content-Type: application/json" \
///      -d '{"aes_key_hex":"...", "rsa_pubkey_base64":"...", "enc_aes_key_hex":"..."}'
/// ```
pub async fn handle_verify(
    Query(params): Query<ProveParams>,
    Json(payload): Json<RsaEncryptedAesKeyInput>,
) -> Json<RsaEncryptedAesKeyResponse> {
    println!("[RSA-Verify] Received request");

    let mode = resolve_mode(params.prove_mode.as_deref());
    println!("[RSA-Verify] Resolved proving mode: {:?}", mode);

    let receipt = zkvm::run_rsa_verify(payload, mode).unwrap();
    println!("[RSA-Verify] Proof generated successfully.");

    let output: RsaEncryptedAesKeyOutput = receipt.journal.decode().unwrap();
    println!("[RSA-Verify] Output decoded from journal. Message : {}", output.message);

    let receipt_base64 = receipt_to_base64(&receipt);
    println!("[RSA-Verify] Receipt serialized to base64 ({} bytes).", receipt_base64.len());

    Json(RsaEncryptedAesKeyResponse { output, receipt_base64 })
}