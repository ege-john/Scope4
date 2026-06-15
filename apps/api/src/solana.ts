import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Idl, Wallet } from '@coral-xyz/anchor';
import { readFileSync } from 'fs';
import { join } from 'path';

// ── Environment Variables ──────────────────────────────────────────────────
const RPC_URL = process.env.SOLANA_RPC_URL || 'http://127.0.0.1:8899';
const PROGRAM_ID_STR = process.env.SOLANA_PROGRAM_ID || '4jokhc6jDx663fiPNdyFs18ywus6KCiGZcDx4aW53duF';

// Load demo keypairs
function loadKeypair(envVar: string): Keypair | null {
  const secretKeyString = process.env[envVar];
  if (!secretKeyString || secretKeyString === '[]') return null;
  try {
    const secretKeyArray = JSON.parse(secretKeyString);
    return Keypair.fromSecretKey(new Uint8Array(secretKeyArray));
  } catch (err) {
    console.error(`Failed to parse ${envVar}`, err);
    return null;
  }
}

export const sellerKeypair = loadKeypair('SELLER_DEMO_KEYPAIR');
export const importerKeypair = loadKeypair('IMPORTER_DEMO_KEYPAIR');
export const logisticsKeypair = loadKeypair('LOGISTICS_DEMO_KEYPAIR');

// ── Anchor Connection Setup ─────────────────────────────────────────────────
export const connection = new Connection(RPC_URL, 'confirmed');

// We use the importer as the default wallet for the provider
const defaultWallet = importerKeypair ? new Wallet(importerKeypair) : new Wallet(Keypair.generate());
export const provider = new AnchorProvider(connection, defaultWallet, { commitment: 'confirmed' });

// Load IDL
const idlPath = join(process.cwd(), '../../packages/contract/scope4/target/idl/scope4.json');
const idlRaw = readFileSync(idlPath, 'utf8');
export const idl = JSON.parse(idlRaw) as Idl;
export const programId = new PublicKey(PROGRAM_ID_STR);

export const program = new Program(idl, provider);
