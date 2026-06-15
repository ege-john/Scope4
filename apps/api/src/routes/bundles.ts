import { Hono } from 'hono';
import { z } from 'zod';
import { supabase, getBundleWithAll, getReadyBundles, writeAuditEvent } from '@scope4/db';
import { program, programId, importerKeypair } from '../solana';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

export const bundlesRouter = new Hono();

const createBundleSchema = z.object({
  tradeId: z.string().length(64, 'Trade ID must be a 64-character hex string'),
});

bundlesRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = createBundleSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: parsed.error.issues }, 400);
    const { tradeId } = parsed.data;

    if (!importerKeypair) return c.json({ error: 'Importer keypair not configured on server' }, 500);

    // 1. Convert hex string to 32 byte array
    const tradeIdBuffer = Buffer.from(tradeId, 'hex');
    const tradeIdArray = Array.from(tradeIdBuffer);

    // 2. Find PDA
    const [bundlePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('bundle'), tradeIdBuffer],
      programId
    );

    // 3. Send transaction to Solana
    const tx = await program.methods
      .initializeBundle(tradeIdArray)
      .accounts({
        bundle: bundlePda,
        importer: importerKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([importerKeypair])
      .rpc();

    // 4. Save to Supabase
    const { data: dbBundle, error } = await supabase
      .from('compliance_bundles')
      .insert({
        trade_id: tradeId,
        bundle_status: 'awaiting_parties',
      })
      .select()
      .single();

    if (error) throw error;

    await writeAuditEvent({
      trade_id: tradeId,
      event_type: 'bundle_initialized',
      actor_type: 'importer',
      actor_identity: importerKeypair.publicKey.toBase58(),
      solana_tx: tx,
    });

    return c.json({ success: true, tx, bundle: dbBundle });
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err.message }, 500);
  }
});

bundlesRouter.get('/', async (c) => {
  const { data, error } = await supabase.from('compliance_bundles').select('*').order('created_at', { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

bundlesRouter.get('/:trade_id', async (c) => {
  const tradeId = c.req.param('trade_id');
  const bundle = await getBundleWithAll(tradeId);
  if (!bundle) return c.json({ error: 'Not found' }, 404);
  return c.json(bundle);
});

bundlesRouter.get('/ready', async (c) => {
  const readyBundles = await getReadyBundles();
  return c.json({ ready: readyBundles });
});
