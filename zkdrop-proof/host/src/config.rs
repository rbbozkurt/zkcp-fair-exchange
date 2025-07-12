use std::env;
use dotenvy::dotenv;

const DEFAULT_PORT : u16 = 8080;

pub fn load_env(){
    dotenv().ok();
}

pub fn get_env_var(key: &str) -> Option<String> {
    env::var(key).ok()
}

pub fn get_port() -> Option<u16> {
    get_env_var("HOST_APP_PORT")?.parse().ok()
}

pub fn get_address() -> String {
    let port = get_port().unwrap_or(DEFAULT_PORT);
    format!("0.0.0.0:{}", port)
}
