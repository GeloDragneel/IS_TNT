<?php

namespace App\Observers;

use App\Models\Accounts_payable_master;
use App\Models\Account_supplier_invoice;
use App\Models\Accounting_settings;
use App\Models\Payment_voucher_detail;

class APMasterObserver
{
    /**
     * Handle the Accounts_payable_master "created" event.
    */
    public function created(Accounts_payable_master $ap): void{
        $account_code = Accounting_settings::where('chart_fix_code', 'AP')->value('account_code');
        Account_supplier_invoice::create([
            'supplier_id'       => $ap->supplier_id,
            'account_code'      => $account_code,
            'transaction_date'  => $ap->ap_date,
            'ap_invoice_no'     => $ap->ap_number,
            'ex_rate'           => $ap->ex_rate,
            'currency'          => $ap->currency,
            'sub_total'         => $ap->sub_total,
            'base_sub_total'    => $ap->base_sub_total,
            'tax_amount'        => $ap->tax,
            'base_tax_amount'   => $ap->base_tax,
            'deposit'           => $ap->deposit,
            'base_deposit'      => $ap->base_deposit,
            'base_amount'       => $ap->base_total,
            'amount'            => $ap->total,
            'debit'             => 0,
            'credit'            => $ap->total,
            'pv_number'         => 0,
            'ap_detail_id'      => $ap->id,
        ]);
    }

    /**
     * Handle the Accounts_payable_master "updated" event.
    */
    public function updated(Accounts_payable_master $ap): void{
        $account_code = Accounting_settings::where('chart_fix_code', 'AP')->value('account_code');

        // Step 1: Update pvoucher_detail APInvoiceNo and RefData
        Payment_voucher_detail::where('ap_invoice_no', $ap->getOriginal('ap_number'))
            ->update([
                'ap_invoice_no' => $ap->ap_number,
                'ref_data'      => $ap->ap_number,
            ]);

        // Step 2: Check if account_supplierinvoice exists
        $existing = Account_supplier_invoice::where('ap_detail_id', $ap->id)->first();

        if ($existing) {
            // Step 3: Update existing record
            $existing->update([
                'supplier_id'       => $ap->supplier_id,
                'account_code'      => $account_code,
                'transaction_date'  => $ap->ap_date,
                'ap_invoice_no'     => $ap->ap_number,
                'ex_rate'           => $ap->ex_rate,
                'currency'          => $ap->currency,
                'sub_total'         => $ap->sub_total,
                'base_sub_total'    => $ap->base_sub_total,
                'tax_amount'        => $ap->tax,
                'base_tax_amount'   => $ap->base_tax,
                'deposit'           => $ap->deposit,
                'base_deposit'      => $ap->base_deposit,
                'base_amount'       => $ap->base_total,
                'amount'            => $ap->total,
                'debit'             => 0,
                'credit'            => $ap->total,
                'pv_number'         => 0,
                'ap_detail_id'      => $ap->id,
            ]);
        } else {
            // Step 4: Insert new record
            Account_supplier_invoice::create([
                'supplier_id'       => $ap->supplier_id,
                'account_code'      => $account_code,
                'transaction_date'  => $ap->ap_date,
                'ap_invoice_no'     => $ap->ap_number,
                'ex_rate'           => $ap->ex_rate,
                'currency'          => $ap->currency,
                'sub_total'         => $ap->sub_total,
                'base_sub_total'    => $ap->base_sub_total,
                'tax_amount'        => $ap->tax,
                'base_tax_amount'   => $ap->base_tax,
                'deposit'           => $ap->deposit,
                'base_deposit'      => $ap->base_deposit,
                'base_amount'       => $ap->base_total,
                'amount'            => $ap->total,
                'debit'             => 0,
                'credit'            => $ap->total,
                'pv_number'         => 0,
                'ap_detail_id'      => $ap->id,
            ]);
        }
    }

    /**
     * Handle the Accounts_payable_master "deleted" event.
    */
    public function deleted(Accounts_payable_master $accounts_payable_master): void{
        //
    }

    /**
     * Handle the Accounts_payable_master "restored" event.
    */
    public function restored(Accounts_payable_master $accounts_payable_master): void{
        //
    }

    /**
     * Handle the Accounts_payable_master "force deleted" event.
    */
    public function forceDeleted(Accounts_payable_master $accounts_payable_master): void{
        //
    }
}
