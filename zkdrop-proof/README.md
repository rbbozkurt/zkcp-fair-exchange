# ZkDrop Proof - Zero-Knowledge Fair Exchange Protocol

ZkDrop Proof is a zero-knowledge powered fair exchange engine designed to verify encryption and decryption operations using Zero-Knowledge Proofs (ZKPs) based on RISC Zero's zkVM. It supports RSA and AES-CTR based cryptographic workflows and offers multiple proving backends including Bonsai.

## 🌟 Features

- **Zero-Knowledge Proofs**: Verifiable cryptographic computations without revealing sensitive data
- **RSA Encryption/Verification**: Proof that an AES key was correctly encrypted using RSA
- **AES-CTR Verification**: Proof that AES-CTR encrypted data decrypts correctly
- **Three Proving Modes**:

  - `local`: Proof generation and verification fully on the host (non-dummy, real execution)
  - `bonsai`: Remote proof generation via Bonsai proving service
  - `bonsai_snark`: Bonsai proof generation followed by SNARK conversion for on-chain use cases

- **REST API**: Expose proof generation via simple HTTP endpoints
- **Docker Support**: Containerized setup for consistent deployment
- **Development Mode (`RISC0_DEV_MODE`)**: Enables dummy proving and dummy verification (fastest), useful for development only

---

## 🧠 Protocol Flow

1. Seller encrypts content with AES-CTR
2. AES key is encrypted using the buyer's RSA public key
3. Seller generates three ZKPs:

   - AES-CTR ciphertext decrypts to plaintext
   - RSA ciphertext decrypts to AES key
   - The encryption logic was executed correctly

4. Buyer verifies the proofs before purchasing
5. After purchase, buyer uses RSA private key to decrypt the AES key
6. AES key is used to decrypt and access the content

---

## 📁 Project Structure

```text
zkdrop-proof/
├── host/               # Host API exposing Axum endpoints
│   ├── src/
│   │   ├── main.rs         # Entry point
│   │   ├── zkvm.rs         # Proof mode dispatcher and guest binary interaction
│   │   ├── config.rs       # Loads .env / runtime settings
│   │   ├── routes.rs       # HTTP routing
│   │   └── handlers/       # Each handler handles one proof type
│   └── Cargo.toml
│
├── methods/            # RISC0 zkVM guest code
│   ├── guest/
│   │   └── src/bin/
│   │       ├── aes_ctr_verifier.rs
│   │       ├── rsa_encrypter.rs
│   │       └── rsa_verifier.rs
│   └── src/lib.rs       # Shared code for guests
│
├── zkdrop-lib/         # Shared logic (used in both host & guest)
│   └── src/
│       ├── types.rs
│       ├── aes_ctr.rs
│       ├── rsa.rs
│       └── utils.rs
│
├── docker-compose.yaml # Compose for running the host service
├── Dockerfile          # Multi-stage container build
├── Makefile            # Compose CLI helpers (compose-up/down/build)
├── .env.template       # Template config for secrets and ports
├── samples/            # HTTP request samples
│   ├── aes-verify-request.http
│   ├── rsa-encrypt-request.http
│   └── rsa-verify-request.http
├── rust-toolchain.toml
├── Cargo.toml          # Workspace manifest
└── README.md
```

---

## 🚀 Getting Started

### ✅ Prerequisites

- Rust >= 1.81.0 (install via \[rustup])
- RISC Zero SDK (install via [`rzup`](https://dev.risczero.com/api/zkvm/install))
- Docker (for containerized use)

### 📦 Setup

```bash
git https://github.com/rbbozkurt/zkcp-fair-exchange.git
cd zkdrop-proof
cp .env.template .env
```

### 🧪 Local Proving Mode

Runs full zkVM execution and proof generation/verification **on your machine**.

```bash
cargo run --release
```

### ⚡ Development Dummy Mode

Set `RISC0_DEV_MODE=1` to enable dummy proof generation and verification (skips actual proving).

```bash
RISC0_DEV_MODE=1 cargo run --release
```

> ⚠️ This is **not** the same as `local` mode. Dev mode **fakes** proofs and is only for fast iterations.

### 🌐 Bonsai Proving

Remote proof generation on [Bonsai](https://bonsai.xyz) infrastructure.

```bash
BONSAI_API_KEY=your_key BONSAI_API_URL=https://api.bonsai.xyz cargo run --release
```

You can also set these in `.env`:

```env
BONSAI_API_KEY=your_key
BONSAI_API_URL=https://api.bonsai.xyz
```

### 🧬 Bonsai SNARK Mode

Use `prove_mode=bonsai_snark` to generate SNARKed proofs (e.g., for on-chain verification).

---

## 🧩 API Endpoints

### `POST /rsa-encrypt?prove_mode=local|bonsai|bonsai_snark`

Generates a proof that AES key was encrypted using RSA public key.

### `POST /rsa-verify?prove_mode=local|bonsai|bonsai_snark`

Verifies that RSA ciphertext decrypts to correct AES key.

### `POST /aes-verify?prove_mode=local|bonsai|bonsai_snark`

Verifies that AES-CTR ciphertext decrypts to original plaintext.

**NOTE: Check the `host/src/handlers` for more info about routes, requests and responses.**

---

## ⚙️ Configuration

| Key              | Description                     | Default    |
| ---------------- | ------------------------------- | ---------- |
| `HOST_APP_PORT`  | HTTP server port                | `8095`     |
| `RISC0_DEV_MODE` | Enables dummy proofs (dev-only) | unset      |
| `BONSAI_API_KEY` | Bonsai access token             | required   |
| `BONSAI_API_URL` | Bonsai API base URL             | see Bonsai |

---

## 🔐 Security Considerations

- Do **not** use `RISC0_DEV_MODE=1` in production.
- Ensure RSA and AES keys are securely generated and stored.
- Use SNARK mode for verifiable on-chain assets.

---

## 🧪 Development & Testing

- Use `samples/` directory to run `.http` requests from tools like VSCode REST Client or Postman.
- Add your logic in `handlers/`, link it via `routes.rs`

---

## 📄 License

MIT License

## 🙏 Acknowledgments

- [RISC Zero](https://github.com/risc0/risc0) zkVM
- Axum for web framework
- Bonsai for remote proving support

---

## 📫 Contact

If you have questions, reach out via GitHub or email.
