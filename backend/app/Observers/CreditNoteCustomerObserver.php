<?php

namespace App\Observers;

use App\Models\Credit_note_customer;
use App\Models\Credit_note_customer_detail;
use App\Models\Credit_note_customer_detail_copy;
use App\Models\Account_customer_cn;
use App\Models\General_ledger;
use App\Models\General_ledger_v2;
use App\Models\Accounting_settings;

class CreditNoteCustomerObserver{

    public function created(Credit_note_customer $creditNote){
        // Insert into t_account_customer_cn
        Account_customer_cn::create([
            'account_code'      => $creditNote->account_code,
            'customer_id'       => $creditNote->customer_id,
            'currency'          => $creditNote->currency,
            'ref_data'          => $creditNote->cr_number,
            'cr_number'         => $creditNote->cr_number,
            'transaction_date'  => $creditNote->cr_date,
            'cr_detail_id'      => $creditNote->id,
            'particulars'       => $creditNote->particulars,
            'ex_rate'           => $creditNote->ex_rate,
            'debit'             => 0,
            'credit'            => $creditNote->amount,
            'amount'            => $creditNote->amount,
            'base_amount'       => $creditNote->base_amount,
        ]);

        // Generate Unique ID like in the SQL trigger: CONCAT(ID, "-1")
        $uniqueID = $creditNote->id . '-1';

        // Insert into t_general_ledger
        General_ledger::create([
            'account_code'     => $creditNote->account_code,
            'transaction_date' => $creditNote->cr_date,
            'acc_table'        => 'cust_credit_notes_master',
            'currency'         => $creditNote->currency,
            'ex_rate'          => $creditNote->ex_rate,
            'acc_table_id'     => $uniqueID,
            'customer_id'      => $creditNote->customer_id,
            'ref_data'         => $creditNote->cr_number,
            'debit'            => 0,
            'credit'           => $creditNote->base_amount,
        ]);

        $this->insert_General_Ledger_v2($creditNote);
    }
    public function updated(Credit_note_customer $creditNote){
        // Check if the Credit Note status is 5 (meaning we need to delete and update details)
        if ($creditNote->cr_status_id == 5) {
            // Step 1: Delete records in `t_account_customer_cn` related to this Credit Note
            Account_customer_cn::where('cr_detail_id', $creditNote->id)->delete();

            // Step 2: Copy `t_credit_notes_detail` data into `t_credit_notes_detail_copy`

            Credit_note_customer_detail::where('cr_number', $creditNote->cr_number)
                ->get()
                ->each(function ($detail) {
                    Credit_note_customer_detail_copy::create($detail->toArray());
                });

            // Step 3: Delete records from `t_credit_notes_detail`
            Credit_note_customer_detail::where('cr_number', $creditNote->cr_number)->delete();
        }
        else{
            // Step 4: If there are existing records in `t_account_customer_cn`, update them
            $accountCustomerCn = Account_customer_cn::where('cr_detail_id', $creditNote->id)->first();

            if ($accountCustomerCn) {
                $accountCustomerCn->update([
                    'account_code'      => $creditNote->account_code,
                    'customer_id'       => $creditNote->customer_id,
                    'currency'          => $creditNote->currency,
                    'ref_data'          => $creditNote->cr_number,
                    'cr_number'         => $creditNote->cr_number,
                    'transaction_date'  => $creditNote->cr_date,
                    'cr_detail_id'      => $creditNote->id,
                    'particulars'       => $creditNote->particulars,
                    'ex_rate'           => $creditNote->ex_rate,
                    'debit'             => 0,
                    'credit'            => $creditNote->amount,
                    'amount'            => $creditNote->amount,
                    'base_amount'       => $creditNote->base_amount,
                ]);
            } else {
                // Step 5: If no existing record in `t_account_customer_cn`, create a new one
                Account_customer_cn::create([
                    'account_code'      => $creditNote->account_code,
                    'customer_id'       => $creditNote->customer_id,
                    'currency'          => $creditNote->currency,
                    'ref_data'          => $creditNote->cr_number,
                    'cr_number'         => $creditNote->cr_number,
                    'transaction_date'  => $creditNote->cr_date,
                    'cr_detail_id'      => $creditNote->id,
                    'particulars'       => $creditNote->particulars,
                    'ex_rate'           => $creditNote->ex_rate,
                    'debit'             => 0,
                    'credit'            => $creditNote->amount,
                    'amount'            => $creditNote->amount,
                    'base_amount'       => $creditNote->base_amount,
                ]);
            }

            // Step 6: Handle General Ledger updates (same as in the trigger)
            $uniqueID = $creditNote->id . '-1';

            $generalLedger = General_ledger::where('acc_table', 'cust_credit_notes_master')
                ->where('acc_table_id', $uniqueID)
                ->first();

            if ($generalLedger) {
                $generalLedger->update([
                    'account_code'     => $creditNote->account_code,
                    'transaction_date' => $creditNote->cr_date,
                    'acc_table'        => 'cust_credit_notes_master',
                    'currency'         => $creditNote->currency,
                    'ex_rate'          => $creditNote->ex_rate,
                    'acc_table_id'     => $uniqueID,
                    'customer_id'      => $creditNote->customer_id,
                    'ref_data'         => $creditNote->cr_number,
                    'debit'            => 0,
                    'credit'           => $creditNote->base_amount,
                ]);
            } else {
                General_ledger::create([
                    'account_code'     => $creditNote->account_code,
                    'transaction_date' => $creditNote->cr_date,
                    'acc_table'        => 'cust_credit_notes_master',
                    'currency'         => $creditNote->currency,
                    'ex_rate'          => $creditNote->ex_rate,
                    'acc_table_id'     => $uniqueID,
                    'customer_id'      => $creditNote->customer_id,
                    'ref_data'         => $creditNote->cr_number,
                    'debit'            => 0,
                    'credit'           => $creditNote->base_amount,
                ]);
            }
        }

        $this->update_General_Ledger_v2($creditNote);
    }
    public function insert_General_Ledger_v2(Credit_note_customer $creditNote){
        $uniqueID1 = $creditNote->id . '-1';
        $AR = Accounting_settings::where('chart_fix_code', 'AR')->value('account_code');

        if($creditNote->cr_status_id != 5){
            General_ledger_v2::create([
                'account_code'      => $AR,
                'transaction_date'  => $creditNote->cr_date,
                'acc_table'         => 'cust_credit_notes_master',
                'currency'          => $creditNote->currency,
                'ex_rate'           => $creditNote->ex_rate,
                'acc_table_id'      => $uniqueID1,
                'customer_id'       => $creditNote->customer_id,
                'ref_data'          => $creditNote->cr_number,
                'amount'            => $creditNote->amount,
                'debit'             => $creditNote->base_amount,
                'credit'            => 0
            ]);
        }
    }
    public function update_General_Ledger_v2(Credit_note_customer $creditNote){
        $uniqueID1 = $creditNote->id . '-1';
        $AR = Accounting_settings::where('chart_fix_code', 'AR')->value('account_code');
        if($creditNote->cr_status_id != 5){

            $generalLedger = General_ledger_v2::where('acc_table', 'cust_credit_notes_master')
                ->where('acc_table_id', $uniqueID1)
                ->first();

            if ($generalLedger) {
                $generalLedger->update([
                    'account_code'      => $AR,
                    'customer_id'       => $creditNote->customer_id,
                    'ref_data'          => $creditNote->cr_number,
                    'amount'            => $creditNote->amount,
                    'debit'             => $creditNote->base_amount,
                    'credit'            => 0
                ]);
            }
        }
        else{
            General_ledger_v2::where('ref_data',$creditNote->cr_number)->delete();
        }
    }
    public function deleted(Credit_note_customer $creditNote){
        // Generate the unique ID like in the SQL trigger
        $uniqueID1 = $creditNote->id . '-1';

        // Delete from `general_ledger` when `Credit_note_customer` is deleted
        General_ledger::where('acc_table', 'cust_credit_notes_master')
            ->where('acc_table_id', $uniqueID1)
            ->delete();
    }
}
