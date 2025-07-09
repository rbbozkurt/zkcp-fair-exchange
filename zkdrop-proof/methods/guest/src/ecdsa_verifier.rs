//use k256::ecdsa::{VerifyingKey, Signature, signature::Verifier};
//use k256::EncodedPoint;

// Verifies that `signature` is a valid ECDSA signature of `message` by `public_key`
//pub fn verify_key_signature(
//    message: &[u8],
//    signature: &[u8],
//    pubkey_bytes: &[u8],
//) -> bool {
//    let pubkey = match EncodedPoint::from_bytes(pubkey_bytes) {
//        Ok(pt) => pt,
//        Err(_) => return false,
 //   };
//
//    let verifying_key = match VerifyingKey::from_encoded_point(&pubkey) {
//        Ok(vk) => vk,
//        Err(_) => return false,
//    };
//
//    let signature = match Signature::from_der(signature) {
//        Ok(sig) => sig,
//        Err(_) => return false,
//    };
//
//    verifying_key.verify(message, &signature).is_ok()
//}
