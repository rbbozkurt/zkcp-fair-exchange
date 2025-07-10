use rsa::{pkcs8::DecodePublicKey, Oaep, RsaPublicKey};
use sha2::Sha256;
use base64::{engine::general_purpose, Engine as _};
use hex::{decode as hex_decode};
use rand_chacha::ChaCha20Rng;
use rand_chacha::rand_core::{SeedableRng, RngCore};
use zkdrop_lib::{RsaEncryptedAesKeyInput, RsaEncryptAesKeyInput};


// ECIES keep that in mind for future work
pub fn rsa_verifier(input: RsaEncryptedAesKeyInput) -> (bool, String) {
    let aes_key_bytes = match hex_decode(&input.aes_key_hex) {
        Ok(bytes) => bytes,
        Err(_) => return (false, String::from("Invalid AES key hex")),
    };

    let rsa_pubkey_der = match general_purpose::STANDARD.decode(&input.rsa_pubkey_base64) {
        Ok(der) => der,
        Err(_) => return (false, String::from("Invalid RSA pubkey base64")),
    };

    let enc_aes_key_bytes = match hex_decode(&input.enc_aes_key_hex) {
        Ok(bytes) => bytes,
        Err(_) => return (false, String::from("Invalid encrypted AES key hex")),
    };

    let pubkey = match RsaPublicKey::from_public_key_der(&rsa_pubkey_der) {
        Ok(key) => key,
        Err(_) => return (false, String::from("RSA pubkey parse error")),
    };

    let mut rng = ChaCha20Rng::seed_from_u64(42);
    let padding = Oaep::new::<Sha256>();
    let enc_result = match pubkey.encrypt(&mut rng, padding, &aes_key_bytes) {
        Ok(data) => data,
        Err(_) => return (false, String::from("Encryption failed")),
    };
   
    if enc_result == enc_aes_key_bytes {
        (true, String::from("✅ RSA encryption matches"))
    } else {
        (false, String::from("❌ Mismatch in RSA encryption"))
    }
}

pub fn rsa_encrypt(input: RsaEncryptAesKeyInput) -> (bool, String, String) {
    let aes_key_bytes = match hex_decode(&input.aes_key_hex) {
        Ok(bytes) => bytes,
        Err(_) => return (false, String::from("Invalid AES key hex"), String::new()),
    };

    let rsa_pubkey_der = match general_purpose::STANDARD.decode(&input.rsa_pubkey_base64) {
        Ok(der) => der,
        Err(_) => return (false, String::from("Invalid RSA pubkey base64"), String::new()),
    };

    let pubkey = match RsaPublicKey::from_public_key_der(&rsa_pubkey_der) {
        Ok(key) => key,
        Err(_) => return (false, String::from("RSA pubkey parse error"), String::new()),
    };

    let mut rng = ChaCha20Rng::seed_from_u64(42);
    let padding = Oaep::new::<Sha256>();
    let enc_result = match pubkey.encrypt(&mut rng, padding, &aes_key_bytes) {
        Ok(data) => data,
        Err(_) => return (false, String::from("Encryption failed"), String::new()),
    };
   
    // Convert the encrypted bytes to hex string
    let encrypted_hex = hex::encode(&enc_result);
    
    (true, String::from("✅ RSA encryption successful"), encrypted_hex)
}