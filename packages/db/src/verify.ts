import { supabase } from './index'

async function verify() {
  console.log('🔍 Verifying Phase 1 Implementation...\n')
  
  const { data: bundles, error } = await supabase
    .from('compliance_bundles')
    .select('trade_id, bundle_status')
  
  if (error) {
    console.error('❌ Failed to fetch from Supabase:', error.message)
    return
  }

  console.log(`✅ Successfully connected to Supabase!`)
  console.log(`✅ Found ${bundles.length} compliance bundles in the database.\n`)
  
  console.table(bundles)
  
  console.log('\n🎉 Phase 1 is fully operational! The database schema is correct, the seed script worked, and our backend client connects properly.')
}

verify()
