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
    const body = await c.req.json();
    const tradeId = body.trade_id as string;
    const sellerName = (body.seller_name as string) || 'Demo Seller A';
    const facilityId = (body.facility_id as string) || 'UNKNOWN';
    const productType = (body.product_type as string) || 'steel';
    const emissionsIntensity = parseFloat(body.emissions_intensity_tco2_per_t as string);
    const methodology = (body.methodology as string) || 'direct_measure';
    const docHash = (body.doc_bundle_hash as string) || 'NO_DOC_HASH';

    if (!tradeId) return c.json({ error: 'trade_id is required' }, 400);
    if (!sellerKeypair) return c.json({ error: 'Seller keypair missing' }, 500);

    // Map product type string to on-chain enum index
    const productTypeMap: Record<string, number> = { steel: 1, cement: 2, aluminium: 3, fertilisers: 4, electricity: 5 };
    const productTypeIndex = productTypeMap[productType] ?? 1;
    const methodologyMap: Record<string, number> = { direct_measure: 1, default_value: 2, national_grid: 3 };
    const methodologyIndex = methodologyMap[methodology] ?? 1;
    const emissionsScaled = Math.round(emissionsIntensity * 100);

    const hashArray = Array.from(Buffer.from(docHash.padEnd(32, '0').slice(0, 32)));
    const tradeIdBuffer = Buffer.from(tradeId.replace(/-/g, '').slice(0, 32).padEnd(32, '0'));
    const tradeIdArray = Array.from(tradeIdBuffer);

    const [bundlePda] = PublicKey.findProgramAddressSync([Buffer.from('bundle'), tradeIdBuffer], programId);
    const [attestPda] = PublicKey.findProgramAddressSync([Buffer.from('seller_attest'), tradeIdBuffer], programId);

    const tx = await program.methods
      .submitSellerAttestation(
        tradeIdArray,
        facilityId,
        productTypeIndex,
        new anchor.BN(emissionsScaled),
        methodologyIndex,
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
      seller_name: sellerName,
      seller_wallet: sellerKeypair.publicKey.toBase58(),
      facility_id: facilityId,
      product_type: productType,
      emissions_intensity_tco2_per_t: emissionsIntensity,
      methodology: methodology,
      doc_bundle_hash: docHash,
      solana_tx: tx
    }).select().single();

    if (dbErr) throw new Error(`DB Insert Error: ${dbErr.message}`);

    if (insertedSeller) {
      await supabase.from('compliance_bundles').update({
        seller_attestation_id: insertedSeller.id,
        seller_attested_at: new Date().toISOString(),
      }).eq('trade_id', tradeId);
    }

    await writeAuditEvent({
      trade_id: tradeId,
      event_type: 'seller_attested',
      actor_type: 'seller',
      actor_identity: sellerKeypair.publicKey.toBase58(),
      solana_tx: tx,
      payload: { facilityId, docHash }
    });

    return c.json({ success: true, solana_tx: tx, trade_id: tradeId });
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err.message }, 500);
  }
});


// ── IMPORTER TRADE RECORD ────────────────────────────────────────────────
attestationsRouter.post('/importer', async (c) => {
  try {
    const body = await c.req.json();
    const importerName = (body.importer_name as string) || 'Demo Importer B';
    const sellerRef = (body.seller_ref as string) || 'Unknown Seller';
    const productType = (body.product_type as string) || 'steel';
    const quantityKg = parseInt(body.quantity_kg as string, 10);
    const originCountry = (body.origin_country as string) || 'TR';
    const destinationCountry = (body.destination_country as string) || 'IT';
    const invoiceRef = (body.invoice_ref as string) || `INV-${Date.now()}`;
    const purchaseDate = (body.purchase_date as string) || new Date().toISOString().split('T')[0];
    const docHash = (body.doc_bundle_hash as string) || 'NO_DOC_HASH';

    if (!importerKeypair) return c.json({ error: 'Importer keypair missing' }, 500);

    const originMap: Record<string, number> = { TR: 1, CN: 2 };
    const destMap: Record<string, number> = { IT: 1, DE: 2, FR: 3, ES: 4, NL: 5 };
    const originIndex = originMap[originCountry] ?? 1;
    const destIndex = destMap[destinationCountry] ?? 1;

    const hashArray = Array.from(Buffer.from(docHash.padEnd(32, '0').slice(0, 32)));

    // Generate a fresh trade_id for this bundle
    const tradeId = `TRD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const tradeIdBuffer = Buffer.from(tradeId.replace(/-/g, '').slice(0, 32).padEnd(32, '0'));
    const tradeIdArray = Array.from(tradeIdBuffer);

    const [bundlePda] = PublicKey.findProgramAddressSync([Buffer.from('bundle'), tradeIdBuffer], programId);
    const [tradePda] = PublicKey.findProgramAddressSync([Buffer.from('trade'), tradeIdBuffer], programId);

    // Step 1: Initialize the bundle PDA on-chain (required before any attestation)
    const initTx = await program.methods
      .initializeBundle(tradeIdArray)
      .accounts({
        bundle: bundlePda,
        importer: importerKeypair.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([importerKeypair])
      .rpc();

    console.log(`Bundle initialized: ${initTx}`);

    // Step 2: Submit the trade record referencing the now-initialized bundle
    const tx = await program.methods
      .submitTradeRecord(
        tradeIdArray,
        new anchor.BN(quantityKg),
        originIndex,
        destIndex,
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

    // Create compliance bundle row in DB
    await supabase.from('compliance_bundles').insert({
      trade_id: tradeId,
      bundle_status: 'awaiting_parties',
      created_at: new Date().toISOString(),
    });

    // Insert trade record
    const { data: insertedTrade, error: dbErr } = await supabase.from('trade_records').insert({
      trade_id: tradeId,
      importer_name: importerName,
      importer_wallet: importerKeypair.publicKey.toBase58(),
      seller_ref: sellerRef,
      product_type: productType,
      quantity_kg: quantityKg,
      origin_country: originCountry,
      destination_country: destinationCountry,
      invoice_ref: invoiceRef,
      purchase_date: purchaseDate,
      doc_bundle_hash: docHash,
      solana_tx: tx
    }).select().single();

    if (dbErr) throw new Error(`DB Insert Error: ${dbErr.message}`);

    if (insertedTrade) {
      await supabase.from('compliance_bundles').update({
        trade_record_id: insertedTrade.id,
        importer_attested_at: new Date().toISOString(),
      }).eq('trade_id', tradeId);
    }

    await writeAuditEvent({
      trade_id: tradeId,
      event_type: 'importer_attested',
      actor_type: 'importer',
      actor_identity: importerKeypair.publicKey.toBase58(),
      solana_tx: tx,
      payload: { quantityKg, docHash }
    });

    return c.json({ success: true, solana_tx: tx, trade_id: tradeId });
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err.message }, 500);
  }
});

// ── LOGISTICS ATTESTATION ────────────────────────────────────────────────
attestationsRouter.post('/logistics', async (c) => {
  try {
    const body = await c.req.json();
    const tradeId = body.trade_id as string;
    const logisticsName = (body.logistics_name as string) || 'Demo Logistics C';
    const shipmentRef = (body.shipment_ref as string) || `SHP-${tradeId?.substring(0, 8)}`;
    const quantityConfirmedKg = parseInt(body.quantity_confirmed_kg as string, 10);
    const originConfirmed = body.origin_confirmed === true || body.origin_confirmed === 'true';
    const routeConfirmed = body.route_confirmed === true || body.route_confirmed === 'true';
    const dispatchDate = body.dispatch_date as string;

    if (!tradeId) return c.json({ error: 'trade_id is required' }, 400);
    if (!logisticsKeypair) return c.json({ error: 'Logistics keypair missing' }, 500);

    const dispatchTimestamp = Math.floor(new Date(dispatchDate).getTime() / 1000);
    const tradeIdBuffer = Buffer.from(tradeId.replace(/-/g, '').slice(0, 32).padEnd(32, '0'));
    const tradeIdArray = Array.from(tradeIdBuffer);
    const hashArray = Array.from(Buffer.alloc(32, 0));

    const [bundlePda] = PublicKey.findProgramAddressSync([Buffer.from('bundle'), tradeIdBuffer], programId);
    const [logisticsPda] = PublicKey.findProgramAddressSync([Buffer.from('logistics'), tradeIdBuffer], programId);

    const tx = await program.methods
      .submitLogisticsAttestation(
        tradeIdArray,
        new anchor.BN(quantityConfirmedKg),
        originConfirmed,
        routeConfirmed,
        new anchor.BN(dispatchTimestamp)
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
      logistics_name: logisticsName,
      logistics_wallet: logisticsKeypair.publicKey.toBase58(),
      shipment_ref: shipmentRef,
      quantity_confirmed_kg: quantityConfirmedKg,
      origin_confirmed: originConfirmed,
      route_confirmed: routeConfirmed,
      dispatch_date: dispatchDate,
      solana_tx: tx
    }).select().single();

    if (dbErr) throw new Error(`DB Insert Error: ${dbErr.message}`);

    if (insertedLogistics) {
      await supabase.from('compliance_bundles').update({
        logistics_attestation_id: insertedLogistics.id,
        logistics_attested_at: new Date().toISOString(),
        bundle_status: 'ready',
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

    return c.json({ success: true, solana_tx: tx });
  } catch (err: any) {
    console.error(err);
    return c.json({ error: err.message }, 500);
  }
});
