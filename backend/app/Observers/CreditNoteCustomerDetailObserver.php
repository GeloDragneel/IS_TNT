<?php

namespace App\Observers;
use App\Models\General_ledger;
use App\Models\General_ledger_v2;
use App\Models\Credit_note_customer;
use App\Models\Credit_note_customer_detail;
use App\Models\Account_customer_cn;

class CreditNoteCustomerDetailObserver
{
    /**
     * Handle the Credit_note_customer_detail "created" event.
    */
    public function created(Credit_note_customer_detail $crDetail): void{
        // Generate the unique ID like in the SQL trigger
        $uniqueID2 = $crDetail->id . '-2';

        // Insert into `general_ledger` on the creation of a new `Credit_note_customer_detail`
        General_ledger::create([
            'account_code'     => $crDetail->account_code,
            'transaction_date' => $crDetail->cr_date,
            'acc_table'        => 'cust_credit_notes_detail',
            'currency'         => $crDetail->currency,
            'ex_rate'          => $crDetail->ex_rate,
            'acc_table_id'     => $uniqueID2,
            'customer_id'      => $crDetail->customer_id,
            'ref_data'         => $crDetail->cr_number,
            'debit'            => $crDetail->base_amount,
            'credit'           => 0,
        ]);

        $this->insert_General_Ledger_v2($crDetail);
    }
    /**
     * Handle the Credit_note_customer_detail "updated" event.
    */
    public function updated(Credit_note_customer_detail $crDetail): void{
        // Generate the unique ID like in the SQL trigger
        $uniqueID2 = $crDetail->id . '-2';

        // Check if the `general_ledger` record exists for the `Credit_note_customer_detail`
        $generalLedger = General_ledger::where('acc_table', 'cust_credit_notes_detail')
            ->where('acc_table_id', $uniqueID2)
            ->first();

        if ($generalLedger) {
            // Update the `general_ledger` record if it exists
            $generalLedger->update([
                'account_code'     => $crDetail->account_code,
                'transaction_date' => $crDetail->cr_date,
                'acc_table'        => 'cust_credit_notes_detail',
                'currency'         => $crDetail->currency,
                'ex_rate'          => $crDetail->ex_rate,
                'acc_table_id'     => $uniqueID2,
                'customer_id'      => $crDetail->customer_id,
                'ref_data'         => $crDetail->cr_number,
                'debit'            => $crDetail->base_amount,
                'credit'           => 0,
            ]);
        } else {
            // Insert into `general_ledger` if no record exists
            General_ledger::create([
                'account_code'     => $crDetail->account_code,
                'transaction_date' => $crDetail->cr_date,
                'acc_table'        => 'cust_credit_notes_detail',
                'currency'         => $crDetail->currency,
                'ex_rate'          => $crDetail->ex_rate,
                'acc_table_id'     => $uniqueID2,
                'customer_id'      => $crDetail->customer_id,
                'ref_data'         => $crDetail->cr_number,
                'debit'            => $crDetail->base_amount,
                'credit'           => 0,
            ]);
        }
        
        $this->update_General_Ledger_v2($crDetail);
    }
    /**
     * Handle the Credit_note_customer_detail "deleted" event.
    */
    public function update_General_Ledger_v2(Credit_note_customer_detail $crDetail){
        $UniqueID2 = $crDetail->id . '-2';
        $UniqueID3 = $crDetail->id . '-3';
        $cr_status_id = Credit_note_customer::where('cr_number',$crDetail->cr_number)->value('cr_status_id');

        if($cr_status_id != 5){
            $generalLedgerV2_0 = General_ledger_v2::where('acc_table_id',$UniqueID2)->first();
            if($generalLedgerV2_0){
                $generalLedgerV2_0->account_code = $crDetail->account_code;
                $generalLedgerV2_0->customer_id = $crDetail->customer_id;
                $generalLedgerV2_0->amount = 0;
                $generalLedgerV2_0->debit = 0;
                $generalLedgerV2_0->credit = 0;
                $generalLedgerV2_0->save();
            }

            $generalLedgerV2_1 = General_ledger_v2::where('acc_table_id',$UniqueID3)->first();
            if($generalLedgerV2_1){
                $generalLedgerV2_1->account_code = 32000;
                $generalLedgerV2_1->customer_id = $crDetail->customer_id;
                $generalLedgerV2_1->amount = $crDetail->amount;
                $generalLedgerV2_1->debit = 0;
                $generalLedgerV2_1->credit = $crDetail->base_amount;
                $generalLedgerV2_1->save();
            }
        }
    }
    public function insert_General_Ledger_v2(Credit_note_customer_detail $crDetail){
        $UniqueID2 = $crDetail->id . '-2';
        $UniqueID3 = $crDetail->id . '-3';
        $cr_status_id = Credit_note_customer::where('cr_number',$crDetail->cr_number)->value('cr_status_id');

        if($cr_status_id != 5){
            General_ledger_v2::create([
                'account_code'     => $crDetail->account_code,
                'transaction_date' => $crDetail->cr_date,
                'acc_table'        => 'cust_credit_notes_detail',
                'currency'         => $crDetail->currency,
                'ex_rate'          => $crDetail->ex_rate,
                'acc_table_id'     => $uniqueID2,
                'customer_id'      => $crDetail->customer_id,
                'ref_data'         => $crDetail->cr_number,
                'amount'           => $crDetail->amount,
                'debit'            => 0,
                'credit'           => 0,
            ]);

            General_ledger_v2::create([
                'account_code'     => $crDetail->account_code,
                'transaction_date' => $crDetail->cr_date,
                'acc_table'        => 'cust_credit_notes_detail',
                'currency'         => $crDetail->currency,
                'ex_rate'          => $crDetail->ex_rate,
                'acc_table_id'     => $UniqueID3,
                'customer_id'      => $crDetail->customer_id,
                'ref_data'         => $crDetail->cr_number,
                'amount'           => $crDetail->amount,
                'debit'            => 0,
                'credit'           => $crDetail->base_amount,
            ]);
        }
    }
    public function deleted(Credit_note_customer_detail $crDetail): void{
        $uniqueID1 = $crDetail->id . '-2';
        // Delete from `general_ledger` when `Credit_note_customer` is deleted
        General_ledger::where('acc_table', 'cust_credit_notes_detail')
            ->where('acc_table_id', $uniqueID1)
            ->delete();
    }
    /**
     * Handle the Credit_note_customer_detail "restored" event.
    */
    public function restored(Credit_note_customer_detail $crDetail): void{
        //
    }
    /**
     * Handle the Credit_note_customer_detail "force deleted" event.
    */
    public function forceDeleted(Credit_note_customer_detail $crDetail): void{
        //
    }
}
