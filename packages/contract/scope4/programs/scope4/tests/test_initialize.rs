use anchor_lang::prelude::*;
use anchor_lang::InstructionData;
use litesvm::LiteSVM;
use scope4::instruction::{InitializeBundle, SubmitTradeRecord};
use scope4::accounts::{
    InitializeBundle as InitializeBundleAccounts,
    SubmitTradeRecord as SubmitTradeRecordAccounts,
};
use solana_keypair::Keypair;
use solana_pubkey::Pubkey;
use solana_signer::Signer;
use solana_instruction::Instruction;
use solana_transaction::Transaction;

#[test]
fn test_initialize_bundle_and_trade_record() {
    let program_id = scope4::ID;
    let mut svm = LiteSVM::new();

    let importer = Keypair::new();
    svm.airdrop(&importer.pubkey(), 10_000_000_000).unwrap();

    let trade_id: [u8; 32] = [1u8; 32];

    // Derive bundle PDA
    let (bundle_pda, _) = Pubkey::find_program_address(
        &[b"bundle", trade_id.as_ref()],
        &program_id,
    );

    // --- 1. Initialize bundle ---
    let init_ix = Instruction {
        program_id,
        accounts: InitializeBundleAccounts {
            bundle: bundle_pda,
            importer: importer.pubkey(),
            system_program: anchor_lang::system_program::ID,
        }
        .to_account_metas(None),
        data: InitializeBundle { trade_id }.data(),
    };

    let blockhash = svm.latest_blockhash();
    let tx = Transaction::new_signed_with_payer(
        &[init_ix],
        Some(&importer.pubkey()),
        &[&importer],
        blockhash,
    );
    svm.send_transaction(tx).expect("initialize_bundle failed");

    // --- 2. Submit trade record ---
    let (trade_pda, _) = Pubkey::find_program_address(
        &[b"trade", trade_id.as_ref()],
        &program_id,
    );

    let trade_ix = Instruction {
        program_id,
        accounts: SubmitTradeRecordAccounts {
            trade_record: trade_pda,
            bundle: bundle_pda,
            importer: importer.pubkey(),
            system_program: anchor_lang::system_program::ID,
        }
        .to_account_metas(None),
        data: SubmitTradeRecord {
            trade_id,
            quantity_kg: 5_000_000,
            origin_country: 1,
            destination_country: 2,
            doc_bundle_hash: [2u8; 32],
        }
        .data(),
    };

    let blockhash = svm.latest_blockhash();
    let tx = Transaction::new_signed_with_payer(
        &[trade_ix],
        Some(&importer.pubkey()),
        &[&importer],
        blockhash,
    );
    svm.send_transaction(tx).expect("submit_trade_record failed");

    println!("✅ initialize_bundle + submit_trade_record passed");
}
