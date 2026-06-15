import { Connection, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';

function loadKeypair(envVar: string): Keypair | null {
  const secretKeyString = process.env[envVar];
  if (!secretKeyString || secretKeyString === '[]') return null;
  try {
    const secretKeyArray = JSON.parse(secretKeyString);
    return Keypair.fromSecretKey(new Uint8Array(secretKeyArray));
  } catch (err) {
    return null;
  }
}

const seller = loadKeypair('SELLER_DEMO_KEYPAIR');
const importer = loadKeypair('IMPORTER_DEMO_KEYPAIR');
const logistics = loadKeypair('LOGISTICS_DEMO_KEYPAIR');

const connection = new Connection(process.env.SOLANA_RPC_URL || 'http://127.0.0.1:8899', 'confirmed');

async function airdrop(keypair: Keypair | null, name: string) {
  if (!keypair) return;
  console.log(`Airdropping 10 SOL to ${name} (${keypair.publicKey.toBase58()})...`);
  const sig = await connection.requestAirdrop(keypair.publicKey, 10 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(sig);
  console.log('Success.');
}

async function run() {
  await airdrop(seller, 'Seller');
  await airdrop(importer, 'Importer');
  await airdrop(logistics, 'Logistics');
}

run();
