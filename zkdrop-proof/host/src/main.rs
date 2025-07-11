use methods::{RSA_ENCRYPTER_ELF, RSA_ENCRYPTER_ID};
use risc0_zkvm::{default_prover, ExecutorEnv};
use zkdrop_lib::types::{AesCtrDecryptionProofInput, RsaEncryptAesKeyInput, RsaEncryptAesKeyOutput};

fn main() {

     //let aes_ctr = AesCtrDecryptionProofInput {
    //    aes_key_hex: String::from("2f5b46817d69d453bb914bd36209d9bd84dbb0933b1d3f417b22517286827f13"),
    //    iv_hex: String::from("01020300000000000000000000000000"),
    //    plaintext_utf8: String::from("Hello world!"),
    //    ciphertext_hex: String::from("6297bcd5f5dafe88312968d9"),
    //};
    
    /* 
    let aes_ctr = AesCtrDecryptionProofInput {
        aes_key_hex: String::from("de15a7f6957c3eb9a86689106a98e3bea6f4b7222a63aa0ba7afda647d2ff98d"),
        iv_hex: String::from("01020300000000000000000000000000"),
        plaintext_utf8: String::from("example fileeee ! "),
        ciphertext_hex: String::from("ef8d7b4abcaea121953432bd58aa69589312"),
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
    println!("Receipt: {:?}", receipt);
    let output: String = receipt.journal.decode().unwrap();
    println!("Output: {}", output);

    // Step 10: Verify the receipt
    receipt.verify(ZKDROP_GUEST_ID).unwrap();
    */

    //let rsa_enc = RsaEncryptedAesKeyInput{
    //    aes_key_hex: String::from("32ec9a3cfee00897de3704677830710ae8d9074b0d88851b3d656435cb6db2b0"),
    //    rsa_pubkey_base64: String::from("MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0z0Nf8AagvQqkT/baHDHYnt0frz/wnWIWDPTJGY2NXrnIDMuBHdBOFjVM3soPfr1nI8ZKjF0KOcGsCqn31gLcTblkQlzIfg7FfO+QVAywoY8wgvt2BKreQ+Fq8gzjhV/EAsJbqWnBoQj+fD0TXy+EZdP378UdePMxEPMWT3Ivao/2Myz2mmnoyVU2AGAhCeouGlgsIhcFfdQhqSF/DlkFlDvo7UKA8cDGZjHxGAzcajQqnAkBu2Wb2eOQXMeIKB3oKqI3AvpqNFpz5tq+y6y3vBhmRqZ+oUFnfQx9wG3nWtACgCksxNh0XZTs8ZSAXKwjKRAniW4EkTSt9AhV3ef4wIDAQAB"), // Replace with actual base64-encoded RSA public key
    //    enc_aes_key_hex: String::from("8655273e91ecb30a5d15cc3267df665c7e639941e25a2b4658ffba8f71dd388083df1f62b9ed5687d40c98485c9abded97f80fea456b67a5d4577268bb65c3038d0662c879465c32573790e462b44e3670fd578259d380b606067e0e55ce3dba3cdee6ba9156e4c9945f3bd9ad7ed9ce505ad87e87c5e808d4cbd21aeaea6f6f787c093424a5c913efbcde17d82ceeb850394b2744535df5e1eac9d7bfec6b0f3e685c866a6237c86892dc1335491e9de984af56b58e4ef118758451953e37f0b404cdd06b77f68fa669556864104f1c52ef9a322df3e25f19b655adbcb153815621244a0b14671f12a8b272b90dbaefd1e5a35bbb14be776562170c5d560942"),
    //}

    let rsa_enc = RsaEncryptAesKeyInput{
        aes_key_hex: String::from("09c40804a785de29d9e199df192549069fced35ab05058332da2c51318a034d0"),
        rsa_pubkey_base64: String::from("MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAgxYfNfUy5CGx4LMUnv9m0mTRFOkIORiwALKEiCp3Gc04ICRcLPGUUkr98nLHsRRH4OuCmKjsLvB6qiWlw+le1lwqAIVYJXcSG6jIR7PkeonBun9G8PlWlegdzys5EQEh923PCAoddm3BWhNMD0Riz1b4Tw8bePO6q3w5BLIg8o4B5u5ockWEZluvnmSmRbuYQmcPiAKIZyRQeD3qQU1AIB2YwjXhTFyEFR6To4NXFt+VYBUtBNNbN1TzXvTw9pG650HaMWKmxUuHsSyqHWQ5SZtmLVFSrhL426eWV/XthkUx1j/dvlfklSdYLERxJD9CcvZxUdoXngjXKlnlFNsjqQIDAQAB"), // Replace with actual base64-encoded RSA public key
    };

    let env = ExecutorEnv::builder()
        .write(&rsa_enc)
        .unwrap()
        .build()
        .unwrap();

    // Step 8: Prove execution
    let prover = default_prover();
    let prove_info = prover.prove(env, RSA_ENCRYPTER_ELF).unwrap();
    let receipt = prove_info.receipt;

    // Step 9: Decode guest journal output (bool)
    println!("Receipt: {:?}", receipt);
    let output: RsaEncryptAesKeyOutput = receipt.journal.decode().unwrap();
    println!("Output: {}", output.message);

    // Step 10: Verify the receipt
    receipt.verify(RSA_ENCRYPTER_ID).unwrap();
    



}
