import { Hono } from 'hono';
import { z } from 'zod';
import { supabase, writeAuditEvent } from '@scope4/db';
import { program, programId, sellerKeypair, importerKeypair, logisticsKeypair } from '../solana';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { createHash } from 'crypto';

export const attestationsRouter = new Hono();

// Helper to hash and upload file
async function processDocument(file: File | string | undefined, tradeId: string, actor: string) {
  if (!file || typeof file === 'string') {
    throw new Error('Valid file document is required');
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Hash the file
  const hashHex = createHash('sha256').update(buffer).digest('hex');
  const hashArray = Array.from(Buffer.from(hashHex, 'hex'));

  // Upload to Supabase Storage
  const fileName = `${tradeId}/${actor}-${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(fileName, buffer, { contentType: file.type });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(fileName);

  return { hashArray, hashHex, publicUrl: publicUrlData.publicUrl };
}

// ── SELLER ATTESTATION ───────────────────────────────────────────────────
attestationsRouter.post('/seller', async (c) => {
  try {
    const body = await c.req.parseBody();
    const tradeId = body.tradeId as string;
    const facilityId = body.facilityId as string;
    const productType = parseInt(body.productType as string, 10);
    const emissionsIntensity = parseInt(body.emissionsIntensity as string, 10);
    const methodology = parseInt(body.methodology as string, 10);
    const file = body.document as File;

    if (!sellerKeypair) return c.json({ error: 'Seller keypair missing' }, 500);

    const { hashArray, hashHex, publicUrl } = await processDocument(file, tradeId, 'seller');

    const tradeIdBuffer = Buffer.from(tradeId, 'hex');
    const tradeIdArray = Array.from(tradeIdBuffer);

    const [bundlePda] = PublicKey.findProgramAddressSync([Buffer.from('bundle'), tradeIdBuffer], programId);
    const [attestPda] = PublicKey.findProgramAddressSync([Buffer.from('seller_attest'), tradeIdBuffer], programId);

    const tx = await program.methods
      .submitSellerAttestation(
        tradeIdArray,
        facilityId,
        productType,
        new anchor.BN(emissionsIntensity),
        methodology,
        hashArray
      )
      .accounts({
        sellerAttestation: attestPda,
        bundle: bundlePda,
        seller: sellerKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([sellerKeypair])
      .rpc();

    // Update DB
    const { data: insertedSeller, error: dbErr } = await supabase.from('seller_attestations').insert({
      trade_id: tradeId,
      seller_name: 'Demo Seller A',
      seller_wallet: sellerKeypair.publicKey.toBase58(),
      facility_id: facilityId,
      product_type: productType === 1 ? 'steel' : 'other',
      emissions_intensity_tco2_per_t: emissionsIntensity / 100, // assuming scale
      methodology: 'direct_measure',
      doc_bundle_hash: hashHex,
      solana_tx: tx
    }).select().single();

    if (dbErr) throw new Error(`DB Insert Error: ${dbErr.message}`);

    if (insertedSeller) {
      await supabase.from('compliance_bundles').update({ seller_attestation_id: insertedSeller.id }).eq('trade_id', tradeId);
    }

    await writeAuditEvent({
      trade_id: tradeId,
      event_type: 'seller_attested',
      actor_type: 'seller',
      actor_identity: sellerKeypair.publicKey.toBase58(),
      solana_tx: tx,
      payload: { facilityId, hashHex }
    });

    return c.json({ success: true, tx, docUrl: publicUrl });
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err.message }, 500);
  }
});

// ── IMPORTER TRADE RECORD ────────────────────────────────────────────────
attestationsRouter.post('/importer', async (c) => {
  try {
    const body = await c.req.parseBody();
    const tradeId = body.tradeId as string;
    const quantityKg = parseInt(body.quantityKg as string, 10);
    const originCountry = parseInt(body.originCountry as string, 10);
    const destinationCountry = parseInt(body.destinationCountry as string, 10);
    const file = body.document as File;

    if (!importerKeypair) return c.json({ error: 'Importer keypair missing' }, 500);

    const { hashArray, hashHex, publicUrl } = await processDocument(file, tradeId, 'importer');

    const tradeIdBuffer = Buffer.from(tradeId, 'hex');
    const tradeIdArray = Array.from(tradeIdBuffer);

    const [bundlePda] = PublicKey.findProgramAddressSync([Buffer.from('bundle'), tradeIdBuffer], programId);
    const [tradePda] = PublicKey.findProgramAddressSync([Buffer.from('trade'), tradeIdBuffer], programId);

    const tx = await program.methods
      .submitTradeRecord(
        tradeIdArray,
        new anchor.BN(quantityKg),
        originCountry,
        destinationCountry,
        hashArray
      )
      .accounts({
        tradeRecord: tradePda,
        bundle: bundlePda,
        importer: importerKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([importerKeypair])
      .rpc();

    // Update DB
    const { data: insertedTrade, error: dbErr } = await supabase.from('trade_records').insert({
      trade_id: tradeId,
      importer_name: 'Demo Importer B',
      importer_wallet: importerKeypair.publicKey.toBase58(),
      seller_ref: 'Demo Seller A',
      product_type: 'steel', // simplify for demo
      quantity_kg: quantityKg,
      origin_country: originCountry === 1 ? 'TR' : 'CN',
      destination_country: destinationCountry === 2 ? 'IT' : 'DE',
      invoice_ref: `INV-${tradeId.substring(0, 8)}`,
      purchase_date: new Date().toISOString().split('T')[0],
      doc_bundle_hash: hashHex,
      solana_tx: tx
    }).select().single();

    if (dbErr) throw new Error(`DB Insert Error: ${dbErr.message}`);

    if (insertedTrade) {
      await supabase.from('compliance_bundles').update({ trade_record_id: insertedTrade.id }).eq('trade_id', tradeId);
    }

    await writeAuditEvent({
      trade_id: tradeId,
      event_type: 'importer_attested',
      actor_type: 'importer',
      actor_identity: importerKeypair.publicKey.toBase58(),
      solana_tx: tx,
      payload: { quantityKg, hashHex }
    });

    return c.json({ success: true, tx, docUrl: publicUrl });
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err.message }, 500);
  }
});

// ── LOGISTICS ATTESTATION ────────────────────────────────────────────────
attestationsRouter.post('/logistics', async (c) => {
  try {
    const body = await c.req.parseBody();
    const tradeId = body.tradeId as string;
    const quantityConfirmedKg = parseInt(body.quantityConfirmedKg as string, 10);
    const originConfirmed = body.originConfirmed === 'true';
    const routeConfirmed = body.routeConfirmed === 'true';
    const dispatchDate = parseInt(body.dispatchDate as string, 10);

    if (!logisticsKeypair) return c.json({ error: 'Logistics keypair missing' }, 500);

    const tradeIdBuffer = Buffer.from(tradeId, 'hex');
    const tradeIdArray = Array.from(tradeIdBuffer);

    const [bundlePda] = PublicKey.findProgramAddressSync([Buffer.from('bundle'), tradeIdBuffer], programId);
    const [logisticsPda] = PublicKey.findProgramAddressSync([Buffer.from('logistics'), tradeIdBuffer], programId);

    const tx = await program.methods
      .submitLogisticsAttestation(
        tradeIdArray,
        new anchor.BN(quantityConfirmedKg),
        originConfirmed,
        routeConfirmed,
        new anchor.BN(dispatchDate)
      )
      .accounts({
        logisticsAttestation: logisticsPda,
        bundle: bundlePda,
        logistics: logisticsKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([logisticsKeypair])
      .rpc();

    // Update DB
    const { data: insertedLogistics, error: dbErr } = await supabase.from('logistics_attestations').insert({
      trade_id: tradeId,
      logistics_name: 'Demo Logistics C',
      logistics_wallet: logisticsKeypair.publicKey.toBase58(),
      shipment_ref: `SHP-${tradeId.substring(0, 8)}`,
      quantity_confirmed_kg: quantityConfirmedKg,
      origin_confirmed: originConfirmed,
      route_confirmed: routeConfirmed,
      dispatch_date: new Date(dispatchDate * 1000).toISOString().split('T')[0],
      solana_tx: tx
    }).select().single();

    if (dbErr) throw new Error(`DB Insert Error: ${dbErr.message}`);

    if (insertedLogistics) {
      await supabase.from('compliance_bundles').update({ 
        logistics_attestation_id: insertedLogistics.id,
        bundle_status: 'ready', // Assume ready when all 3 are in (logistics is typically last)
        ready_at: new Date().toISOString()
      }).eq('trade_id', tradeId);
    }

    await writeAuditEvent({
      trade_id: tradeId,
      event_type: 'logistics_attested',
      actor_type: 'logistics',
      actor_identity: logisticsKeypair.publicKey.toBase58(),
      solana_tx: tx,
    });

    return c.json({ success: true, tx });
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err.message }, 500);
  }
});
