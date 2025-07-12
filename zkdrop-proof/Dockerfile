FROM rust:1.81-slim AS builder

# Install dependencies
RUN apt-get update && apt-get install -y \
    build-essential pkg-config libssl-dev curl git unzip bash cmake ninja-build && \
    rm -rf /var/lib/apt/lists/*

# Install rzup and toolchain
RUN curl -L https://risczero.com/install | bash && \
    /root/.risc0/bin/rzup install rust 1.81.0 && \
    /root/.risc0/bin/rzup install cpp 2024.1.5 && \
    /root/.risc0/bin/rzup install r0vm 2.2.0 && \
    /root/.risc0/bin/rzup install cargo-risczero 2.2.0

# Set up correct PATH for later steps
ENV PATH="/root/.cargo/bin:/root/.risc0/bin:$PATH"

WORKDIR /zkdrop-proof
COPY . .

RUN cargo build --release

# Optional: expose API port
EXPOSE 8095

# Enable RISC0 dev mode (for local proving)
ENV RISC0_DEV_MODE=1

# Run host binary
# Run the application using cargo, just like you do locally
CMD ["cargo", "run", "--release"]