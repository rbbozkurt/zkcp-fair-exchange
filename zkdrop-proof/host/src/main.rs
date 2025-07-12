use axum::{Router};
use tracing_subscriber::FmtSubscriber;
mod routes;
mod zkvm;
mod handlers;

#[tokio::main]
async fn main() {
     // Setup logging
     FmtSubscriber::builder().init();

     // Build app with routes
     let app = routes::build_router();
 
     // Run server
     let listener = tokio::net::TcpListener::bind("0.0.0.0:8085").await.unwrap();
     println!("Server running on http://localhost:8085");
     axum::serve(listener, app).await.unwrap();

}
