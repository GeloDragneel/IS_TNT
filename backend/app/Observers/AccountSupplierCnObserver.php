<?php

namespace App\Observers;

use App\Models\Account_supplier_cn;
use App\Models\Accounts_payable_master;
use App\Models\Account_supplier_invoice;
use App\Models\Credit_supplier;

class AccountSupplierCnObserver
{
    /**
     * Handle the Account_supplier_cn "created" event.
    */
    public function created(Account_supplier_cn $record): void{
        $this->updateApInvoiceStatus($record->ap_invoice_no);
        $this->updateSupplierCredits($record->supplier_id);
    }
    /**
     * Handle the Account_supplier_cn "updated" event.
    */
    public function updated(Account_supplier_cn $account_supplier_cn): void{
        $this->updateApInvoiceStatus($record->ap_invoice_no);
        $this->updateSupplierCredits($record->supplier_id);
    }

    /**
     * Handle the Account_supplier_cn "deleted" event.
    */
    public function deleted(Account_supplier_cn $account_supplier_cn): void{
        $this->updateApInvoiceStatus($record->ap_invoice_no);
        $this->updateSupplierCredits($record->supplier_id);
    }
    /**
     * Handle the Account_supplier_cn "restored" event.
    */
    public function restored(Account_supplier_cn $account_supplier_cn): void{
        //
    }
    /**
     * Handle the Account_supplier_cn "force deleted" event.
    */
    public function forceDeleted(Account_supplier_cn $account_supplier_cn): void{
        //
    }
    public function updateApInvoiceStatus(string $apInvoiceNo){
        // Step 1: Get credit used
        $creditUsed = Account_supplier_cn::where('ap_invoice_no', $apInvoiceNo)
            ->whereRaw('CHAR_LENGTH(ap_invoice_no) > 3')
            ->sum('amount'); // 👈 'Amount' from your SQL

        // Step 2: Get AP invoice balance
        $invoice = Account_supplier_invoice::where('ap_invoice_no', $apInvoiceNo)->get();

        $totalCredit = $invoice->sum('credit');
        $totalDebit = $invoice->sum('debit');
        $apInvoiceBalance = ($totalCredit - $totalDebit) - $creditUsed;

        // Step 3: Get total invoice amount
        $apMaster = Accounts_payable_master::where('ap_number', $apInvoiceNo)->first();

        if (!$apMaster) {
            return; // Invoice not found
        }

        $apInvoiceAmountToPay = $apMaster->total; // Assuming 'total' is the full invoice amount

        // Step 4: Update status
        if ($apInvoiceBalance == 0) {
            $apMaster->invoice_status_id = 1; // Fully paid
        } elseif ($apInvoiceBalance > 0 && $apInvoiceBalance < $apInvoiceAmountToPay) {
            $apMaster->invoice_status_id = 3; // Partially paid
        } elseif ($apInvoiceBalance == $apInvoiceAmountToPay) {
            $apMaster->invoice_status_id = 2; // Unpaid
        }
        $apMaster->save();
    }
    public function updateSupplierCredits($supplierId){
        // Step 1: Delete existing credits for this supplier
        Credit_supplier::where('supplier_id', $supplierId)->delete();

        // Step 2: Get all account entries for the supplier
        $entries = Account_supplier_cn::where('supplier_id', $supplierId)->get();

        // Step 3: Group by currency and calculate current credit
        $grouped = $entries->groupBy('currency');

        foreach ($grouped as $currency => $records) {
            $currentCredit = $records->sum(function ($item) {
                return $item->credit - $item->debit;
            });

            // Step 4: Insert new credit record
            Credit_supplier::create([
                'supplier_id' => $supplierId,
                'currency' => $currency,
                'current_credit' => $currentCredit,
            ]);
        }
    }
}
