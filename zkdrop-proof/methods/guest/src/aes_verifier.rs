//use aes_gcm::{Aes256Gcm, Key, Nonce};
// use aes_gcm::aead::{Aead, KeyInit};

//pub fn verify_data_encryption(
//    plaintext: &[u8],
//    encrypted_with_iv: &[u8],
//    key_bytes: &[u8],
//) -> bool {
//    if encrypted_with_iv.len() < 12 || key_bytes.len() != 32 {
//        return false;
//    }
//
//    let (iv, ciphertext) = encrypted_with_iv.split_at(12);
//    let key = Key::from_slice(key_bytes);
//    let cipher = Aes256Gcm::new(key);
//    let nonce = Nonce::from_slice(iv);
//
//    match cipher.encrypt(nonce, plaintext) {
//        Ok(computed_ciphertext) => computed_ciphertext == ciphertext,
//        Err(_) => false,
//    }
//}
