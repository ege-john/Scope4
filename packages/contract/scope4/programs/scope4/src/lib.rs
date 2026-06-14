use anchor_lang::prelude::*;

declare_id!("4jokhc6jDx663fiPNdyFs18ywus6KCiGZcDx4aW53duF");

#[program]
pub mod scope4 {
    use super::*;

    pub fn initialize_bundle(ctx: Context<InitializeBundle>, trade_id: [u8; 32]) -> Result<()> {
        let bundle = &mut ctx.accounts.bundle;
        bundle.trade_id = trade_id;
        bundle.importer = ctx.accounts.importer.key();
        bundle.seller_attested = false;
        bundle.importer_attested = false;
        bundle.logistics_attested = false;
        bundle.status = BundleStatus::AwaitingParties;
        bundle.created_at = Clock::get()?.unix_timestamp;
        bundle.ready_at = None;
        Ok(())
    }

    pub fn submit_seller_attestation(
        ctx: Context<SubmitSellerAttestation>,
        trade_id: [u8; 32],
        facility_id: String,
        product_type: u8,
        emissions_intensity: u64,   // tCO2/t × 1000 (3 decimal places)
        methodology: u8,
        doc_bundle_hash: [u8; 32],
    ) -> Result<()> {
        let attest = &mut ctx.accounts.seller_attestation;
        attest.trade_id = trade_id;
        attest.seller = ctx.accounts.seller.key();
        attest.facility_id = facility_id;
        attest.product_type = product_type;
        attest.emissions_intensity = emissions_intensity;
        attest.methodology = methodology;
        attest.doc_bundle_hash = doc_bundle_hash;
        attest.submitted_at = Clock::get()?.unix_timestamp;

        let bundle = &mut ctx.accounts.bundle;
        bundle.seller_attested = true;
        check_readiness(bundle)?;
        Ok(())
    }

    pub fn submit_trade_record(
        ctx: Context<SubmitTradeRecord>,
        trade_id: [u8; 32],
        quantity_kg: u64,
        origin_country: u8,
        destination_country: u8,
        doc_bundle_hash: [u8; 32],
    ) -> Result<()> {
        let record = &mut ctx.accounts.trade_record;
        record.trade_id = trade_id;
        record.importer = ctx.accounts.importer.key();
        record.quantity_kg = quantity_kg;
        record.origin_country = origin_country;
        record.destination_country = destination_country;
        record.doc_bundle_hash = doc_bundle_hash;
        record.submitted_at = Clock::get()?.unix_timestamp;

        let bundle = &mut ctx.accounts.bundle;
        bundle.importer_attested = true;
        check_readiness(bundle)?;
        Ok(())
    }

    pub fn submit_logistics_attestation(
        ctx: Context<SubmitLogisticsAttestation>,
        trade_id: [u8; 32],
        quantity_confirmed_kg: u64,
        origin_confirmed: bool,
        route_confirmed: bool,
        dispatch_date: i64,
    ) -> Result<()> {
        let attest = &mut ctx.accounts.logistics_attestation;
        attest.trade_id = trade_id;
        attest.logistics = ctx.accounts.logistics.key();
        attest.quantity_confirmed_kg = quantity_confirmed_kg;
        attest.origin_confirmed = origin_confirmed;
        attest.route_confirmed = route_confirmed;
        attest.dispatch_date = dispatch_date;
        attest.attested_at = Clock::get()?.unix_timestamp;

        let bundle = &mut ctx.accounts.bundle;
        bundle.logistics_attested = true;
        check_readiness(bundle)?;
        Ok(())
    }
}

// ── Readiness check helper ──────────────────────────────────────────────────

fn check_readiness(bundle: &mut Account<ComplianceBundle>) -> Result<()> {
    if bundle.seller_attested && bundle.importer_attested && bundle.logistics_attested {
        bundle.status = BundleStatus::ReadyForProcessing;
        bundle.ready_at = Some(Clock::get()?.unix_timestamp);
        emit!(ComplianceBundleReady {
            trade_id: bundle.trade_id,
            importer: bundle.importer,
            ready_at: bundle.ready_at.unwrap(),
        });
    }
    Ok(())
}

// ── Accounts ───────────────────────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(trade_id: [u8; 32])]
pub struct InitializeBundle<'info> {
    #[account(
        init,
        payer = importer,
        space = 8 + ComplianceBundle::SPACE,
        seeds = [b"bundle", trade_id.as_ref()],
        bump
    )]
    pub bundle: Account<'info, ComplianceBundle>,
    #[account(mut)]
    pub importer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(trade_id: [u8; 32])]
pub struct SubmitSellerAttestation<'info> {
    #[account(
        init,
        payer = seller,
        space = 8 + SellerAttestationAccount::SPACE,
        seeds = [b"seller_attest", trade_id.as_ref()],
        bump
    )]
    pub seller_attestation: Account<'info, SellerAttestationAccount>,
    #[account(mut, seeds = [b"bundle", trade_id.as_ref()], bump)]
    pub bundle: Account<'info, ComplianceBundle>,
    #[account(mut)]
    pub seller: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(trade_id: [u8; 32])]
pub struct SubmitTradeRecord<'info> {
    #[account(
        init, payer = importer,
        space = 8 + TradeRecordAccount::SPACE,
        seeds = [b"trade", trade_id.as_ref()], bump
    )]
    pub trade_record: Account<'info, TradeRecordAccount>,
    #[account(mut, seeds = [b"bundle", trade_id.as_ref()], bump)]
    pub bundle: Account<'info, ComplianceBundle>,
    #[account(mut)]
    pub importer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(trade_id: [u8; 32])]
pub struct SubmitLogisticsAttestation<'info> {
    #[account(
        init, payer = logistics,
        space = 8 + LogisticsAttestationAccount::SPACE,
        seeds = [b"logistics", trade_id.as_ref()], bump
    )]
    pub logistics_attestation: Account<'info, LogisticsAttestationAccount>,
    #[account(mut, seeds = [b"bundle", trade_id.as_ref()], bump)]
    pub bundle: Account<'info, ComplianceBundle>,
    #[account(mut)]
    pub logistics: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ── State structs ──────────────────────────────────────────────────────────

#[account]
pub struct ComplianceBundle {
    pub trade_id: [u8; 32],
    pub importer: Pubkey,
    pub seller_attested: bool,
    pub importer_attested: bool,
    pub logistics_attested: bool,
    pub status: BundleStatus,
    pub created_at: i64,
    pub ready_at: Option<i64>,
}

impl ComplianceBundle {
    pub const SPACE: usize = 32 + 32 + 1 + 1 + 1 + 1 + 8 + 9; // Option<i64> = 9
}

#[account]
pub struct SellerAttestationAccount {
    pub trade_id: [u8; 32],
    pub seller: Pubkey,
    pub product_type: u8,
    pub emissions_intensity: u64,
    pub methodology: u8,
    pub doc_bundle_hash: [u8; 32],
    pub submitted_at: i64,
    pub facility_id: String,  // 4 + 64 bytes
}

impl SellerAttestationAccount {
    pub const SPACE: usize = 32 + 32 + 1 + 8 + 1 + 32 + 8 + (4 + 64);
}

#[account]
pub struct TradeRecordAccount {
    pub trade_id: [u8; 32],
    pub importer: Pubkey,
    pub quantity_kg: u64,
    pub origin_country: u8,
    pub destination_country: u8,
    pub doc_bundle_hash: [u8; 32],
    pub submitted_at: i64,
}

impl TradeRecordAccount {
    pub const SPACE: usize = 32 + 32 + 8 + 1 + 1 + 32 + 8;
}

#[account]
pub struct LogisticsAttestationAccount {
    pub trade_id: [u8; 32],
    pub logistics: Pubkey,
    pub quantity_confirmed_kg: u64,
    pub origin_confirmed: bool,
    pub route_confirmed: bool,
    pub dispatch_date: i64,
    pub attested_at: i64,
}

impl LogisticsAttestationAccount {
    pub const SPACE: usize = 32 + 32 + 8 + 1 + 1 + 8 + 8;
}

// ── Enums ──────────────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum BundleStatus {
    AwaitingParties,
    ReadyForProcessing,
    Processing,
    Complete,
}

// ── Events ─────────────────────────────────────────────────────────────────

#[event]
pub struct ComplianceBundleReady {
    pub trade_id: [u8; 32],
    pub importer: Pubkey,
    pub ready_at: i64,
}
