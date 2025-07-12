use std::time::Duration;

use anyhow::Result;
use bonsai_sdk::blocking::Client;
use methods::{
    AES_CTR_VERIFIER_ELF, AES_CTR_VERIFIER_ID, RSA_ENCRYPTER_ELF, RSA_ENCRYPTER_ID,
    RSA_VERIFIER_ELF, RSA_VERIFIER_ID,
};
use risc0_zkvm::{compute_image_id, default_prover, Digest, ExecutorEnv, Receipt};
use zkdrop_lib::types::{
    AesCtrDecryptionProofInput, RsaEncryptAesKeyInput, RsaEncryptedAesKeyInput,
};

use bincode::{deserialize, serialize};

#[derive(Debug, Clone, Copy)]
pub enum ProveMode {
    Local,
    Bonsai,
    BonsaiWithSnark,
}

fn run_local(env: ExecutorEnv, elf: &[u8], method_id: &[u32; 8]) -> Receipt {
    let prove_info = default_prover().prove(env, elf).unwrap();

    let receipt: Receipt = prove_info.receipt;
    let digest = Digest::from(*method_id);
    assert_eq!(receipt.verify(digest), Ok(()));

    receipt
}

fn run_in_bonsai(
    input_data: Vec<u8>,
    elf: &[u8],
    method_id: &[u32; 8],
    use_snark: bool,
) -> Result<Receipt> {
    let client = Client::from_env(risc0_zkvm::VERSION)?;

    let image_id = hex::encode(compute_image_id(elf)?);
    client.upload_img(&image_id, elf.to_vec())?;

    let input_id = client.upload_input(input_data)?;

    let assumptions: Vec<String> = vec![];
    let execute_only = false;

    let session = client.create_session(image_id.clone(), input_id, assumptions, execute_only)?;

    loop {
        let res = session.status(&client)?;
        if res.status == "RUNNING" {
            eprintln!(
                "Current status: {} - state: {} - continue polling...",
                res.status,
                res.state.unwrap_or_default()
            );
            std::thread::sleep(Duration::from_secs(15));
            continue;
        }
        if res.status == "SUCCEEDED" {
            let receipt_url = res
                .receipt_url
                .expect("API error, missing receipt on completed session");

            let receipt_buf = client.download(&receipt_url)?;
            let receipt: Receipt = deserialize(&receipt_buf)?;
            let digest = Digest::from(*method_id);
            receipt.verify(digest)?;

            if use_snark {
                return run_stark2snark(session.uuid);
            }

            return Ok(receipt);
        } else {
            panic!(
                "Workflow exited: {} - | err: {}",
                res.status,
                res.error_msg.unwrap_or_default()
            );
        }
    }
}

pub fn run_stark2snark(session_id: String) -> Result<Receipt> {
    let client = Client::from_env(risc0_zkvm::VERSION)?;

    let snark_session = client.create_snark(session_id)?;
    eprintln!("Created snark session: {}", snark_session.uuid);

    loop {
        let res = snark_session.status(&client)?;
        match res.status.as_str() {
            "RUNNING" => {
                eprintln!("Current status: {} - continue polling...", res.status);
                std::thread::sleep(Duration::from_secs(15));
                continue;
            }
            "SUCCEEDED" => {
                let receipt_buf = client.download(&res.output.unwrap())?;
                let snark_receipt: Receipt = deserialize(&receipt_buf)?;
                return Ok(snark_receipt);
            }
            _ => {
                panic!(
                    "Workflow exited: {} err: {}",
                    res.status,
                    res.error_msg.unwrap_or_default()
                );
            }
        }
    }
}

pub fn run_aes_verify(input: AesCtrDecryptionProofInput, mode: ProveMode) -> Result<Receipt> {
    match mode {
        ProveMode::Local => {
            let env = ExecutorEnv::builder().write(&input)?.build()?;
            Ok(run_local(env, AES_CTR_VERIFIER_ELF, &AES_CTR_VERIFIER_ID))
        }
        ProveMode::Bonsai => run_in_bonsai(
            serialize(&input)?,
            AES_CTR_VERIFIER_ELF,
            &AES_CTR_VERIFIER_ID,
            false,
        ),
        ProveMode::BonsaiWithSnark => run_in_bonsai(
            serialize(&input)?,
            AES_CTR_VERIFIER_ELF,
            &AES_CTR_VERIFIER_ID,
            true,
        ),
    }
}

pub fn run_rsa_encrypt(input: RsaEncryptAesKeyInput, mode: ProveMode) -> Result<Receipt> {
    match mode {
        ProveMode::Local => {
            let env = ExecutorEnv::builder().write(&input)?.build()?;
            Ok(run_local(env, RSA_ENCRYPTER_ELF, &RSA_ENCRYPTER_ID))
        }
        ProveMode::Bonsai => run_in_bonsai(
            serialize(&input)?,
            RSA_ENCRYPTER_ELF,
            &RSA_ENCRYPTER_ID,
            false,
        ),
        ProveMode::BonsaiWithSnark => run_in_bonsai(
            serialize(&input)?,
            RSA_ENCRYPTER_ELF,
            &RSA_ENCRYPTER_ID,
            true,
        ),
    }
}

pub fn run_rsa_verify(input: RsaEncryptedAesKeyInput, mode: ProveMode) -> Result<Receipt> {
    match mode {
        ProveMode::Local => {
            let env = ExecutorEnv::builder().write(&input)?.build()?;
            Ok(run_local(env, RSA_VERIFIER_ELF, &RSA_VERIFIER_ID))
        }
        ProveMode::Bonsai => run_in_bonsai(
            serialize(&input)?,
            RSA_VERIFIER_ELF,
            &RSA_VERIFIER_ID,
            false,
        ),
        ProveMode::BonsaiWithSnark => {
            run_in_bonsai(serialize(&input)?, RSA_VERIFIER_ELF, &RSA_VERIFIER_ID, true)
        }
    }
}
