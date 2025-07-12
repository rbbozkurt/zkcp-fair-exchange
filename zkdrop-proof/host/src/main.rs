use axum;
use tracing_subscriber::FmtSubscriber;
mod routes;
mod zkvm;
mod handlers;
mod config;

#[tokio::main]
async fn main() {

    config::load_env();

    // Setup logging
    FmtSubscriber::builder().init();

    // Build app with routes
    let app = routes::build_router();

    // Run server
    let listener = tokio::net::TcpListener::bind(config::get_address()).await.unwrap();
    println!("🟢 Server starting on {}", config::get_address());
    axum::serve(listener, app).await.unwrap();
}
