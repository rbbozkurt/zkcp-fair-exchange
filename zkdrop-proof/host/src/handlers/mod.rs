/// AES-CTR proof module handlers
pub mod aes_ctr;

/// RSA key encryption/decryption proof module handlers
pub mod rsa;

use crate::zkvm::ProveMode;
use serde::Deserialize;

/// Query parameters used for selecting the proving mode.
/// Supported values:
/// - `bonsai`
/// - `bonsai_snark`
/// - anything else (or omitted) defaults to `local`
#[derive(Deserialize)]
pub struct ProveParams {
    pub prove_mode: Option<String>, // allows query param like `?prove_mode=local`
}

/// Resolves a string-based mode (from query string) to a typed `ProveMode` enum.
///
/// # Arguments
/// * `mode` - An optional string value, e.g., `"bonsai"` or `"bonsai_snark"`
///
/// # Returns
/// * `ProveMode::Bonsai` if "bonsai"
/// * `ProveMode::BonsaiWithSnark` if "bonsai_snark"
/// * `ProveMode::Local` (default) otherwise
pub fn resolve_mode(mode: Option<&str>) -> ProveMode {
    match mode {
        Some("bonsai") => {
            println!("[resolve_mode] Proving mode resolved: Bonsai");
            ProveMode::Bonsai
        }
        Some("bonsai_snark") => {
            println!("[resolve_mode] Proving mode resolved: Bonsai with SNARK");
            ProveMode::BonsaiWithSnark
        }
        Some("local") | None => {
            println!("[resolve_mode] Proving mode resolved: Local (default)");
            ProveMode::Local
        }
        other => {
            println!(
                "[resolve_mode] Proving mode not recognized ({:?}), defaulting to Local",
                other
            );
            ProveMode::Local
        }
    }
}
