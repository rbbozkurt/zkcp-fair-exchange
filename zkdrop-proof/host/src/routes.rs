use axum::{Router};
use crate::handlers::{aes_ctr, rsa};

pub fn build_router() -> Router {
    Router::new()
        .route("/aes-verify", axum::routing::post(aes_ctr::handle_verify))
        .route("/rsa-encrypt", axum::routing::post(rsa::handle_encrypt))
        .route("/rsa-verify", axum::routing::post(rsa::handle_verify))
}
