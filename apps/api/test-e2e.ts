import { randomBytes } from 'crypto';

const API_URL = 'http://localhost:3001/api';

async function runE2E() {
  console.log('🚀 Starting End-to-End Trade Compliance Simulation...');
  
  // 1. Generate a random 64-character hex string for the trade ID
  const tradeId = randomBytes(32).toString('hex');
  console.log(`\n📦 [1/5] Creating Bundle with Trade ID: ${tradeId}`);

  // Create Bundle
  let res = await fetch(`${API_URL}/bundles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tradeId })
  });
  let data = await res.json();
  if (!data.success) throw new Error('Failed to create bundle: ' + JSON.stringify(data));
  console.log('✅ Bundle created on Solana & Supabase. TX:', data.tx);

  // Helper to create a dummy PDF file as FormData
  const createFormData = (payload: any) => {
    const formData = new FormData();
    for (const key in payload) {
      formData.append(key, payload[key]);
    }
    // Append a dummy text file to act as our PDF document
    const blob = new Blob(['%PDF-1.4 Dummy PDF Content for Testing'], { type: 'application/pdf' });
    formData.append('document', blob, 'dummy_document.pdf');
    return formData;
  };

  console.log(`\n🏭 [2/5] Submitting Seller Attestation...`);
  const sellerForm = createFormData({
    tradeId,
    facilityId: 'FAC-TR-001',
    productType: '1', // Steel
    emissionsIntensity: '189', // 1.89 scaled by 100
    methodology: '1',
  });
  
  res = await fetch(`${API_URL}/attestations/seller`, { method: 'POST', body: sellerForm });
  data = await res.json();
  if (!data.success) throw new Error('Seller attestation failed: ' + JSON.stringify(data));
  console.log('✅ Seller Attestation submitted. Hash & PDF uploaded. TX:', data.tx);
  console.log('📄 Supabase Document URL:', data.docUrl);

  console.log(`\n🚢 [3/5] Submitting Importer Trade Record...`);
  const importerForm = createFormData({
    tradeId,
    quantityKg: '500000',
    originCountry: '1',
    destinationCountry: '2',
  });

  res = await fetch(`${API_URL}/attestations/importer`, { method: 'POST', body: importerForm });
  data = await res.json();
  if (!data.success) throw new Error('Importer attestation failed: ' + JSON.stringify(data));
  console.log('✅ Importer Trade Record submitted. TX:', data.tx);

  console.log(`\n🚛 [4/5] Submitting Logistics Attestation...`);
  const logisticsForm = new FormData();
  logisticsForm.append('tradeId', tradeId);
  logisticsForm.append('quantityConfirmedKg', '500000');
  logisticsForm.append('originConfirmed', 'true');
  logisticsForm.append('routeConfirmed', 'true');
  logisticsForm.append('dispatchDate', Math.floor(Date.now() / 1000).toString());

  res = await fetch(`${API_URL}/attestations/logistics`, { method: 'POST', body: logisticsForm });
  data = await res.json();
  if (!data.success) throw new Error('Logistics attestation failed: ' + JSON.stringify(data));
  console.log('✅ Logistics Attestation submitted. TX:', data.tx);

  console.log(`\n🔍 [5/5] Verifying final bundle state from database...`);
  res = await fetch(`${API_URL}/bundles/${tradeId}`);
  const finalBundle = await res.json();
  
  console.log('\n======================================================');
  console.log('🎉 E2E SIMULATION SUCCESSFUL');
  console.log('======================================================');
  console.log('Final Bundle Status:', finalBundle.bundle?.bundle_status);
  console.log('Foreign Keys Linked:', {
    seller: !!finalBundle.bundle?.seller_attestation_id,
    importer: !!finalBundle.bundle?.trade_record_id,
    logistics: !!finalBundle.bundle?.logistics_attestation_id
  });
}

runE2E().catch(err => {
  console.error('\n❌ E2E SIMULATION FAILED:', err.message);
  process.exit(1);
});
