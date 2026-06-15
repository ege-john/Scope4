#!/bin/bash
set -e

echo "==========================================="
echo "1/3: Installing Rust..."
echo "==========================================="
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env

echo "==========================================="
echo "2/3: Installing Solana CLI..."
echo "==========================================="
sh -c "$(curl -sSfL https://release.anza.xyz/v2.1.0/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

echo "==========================================="
echo "3/3: Installing Anchor (AVM)..."
echo "This step compiles from source and may take 5-15 minutes."
echo "==========================================="
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

echo "==========================================="
echo "Installation successfully completed! 🎉"
echo "==========================================="
