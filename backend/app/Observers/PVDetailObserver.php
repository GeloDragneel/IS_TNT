<?php

namespace App\Observers;

use App\Models\Payment_voucher_detail;
use App\Models\Payment_voucher_master;
use App\Models\Accounting_settings;
use App\Models\General_ledger;
use App\Models\Account_payment_voucher;
use App\Models\Account_supplier_cn;
use App\Models\Grn_details;
use App\Models\POrder_detail;
use App\Models\Grn_accounts_payable;
use App\Models\General_ledger_v2;

use Illuminate\Support\Facades\DB;

class PVDetailObserver{
    /**
     * Handle the Payment_voucher_detail "created" event.
    */
    public function created(Payment_voucher_detail $pv_details): void{
        DB::transaction(function () use ($pv_details) {
            // Fetch fixed accounts
            $accounts = Accounting_settings::whereIn('chart_fix_code', [
                'AP', 'DEPSUP', 'SUPTADVPAY'
            ])->pluck('account_code', 'chart_fix_code');

            $AP = $accounts['AP'] ?? null;
            $DEPSUP = $accounts['DEPSUP'] ?? null;
            $SUPTADVPAY = $accounts['SUPTADVPAY'] ?? null;

            // Determine payment type logic
            switch ($pv_details->payment_type_id) {
                case 1:
                    $this->handlePaymentType1($pv_details,$DEPSUP,$SUPTADVPAY,$AP);
                    break;
                case 2:
                    $this->handlePaymentType2($pv_details);
                    break;
                case 3:
                    $this->handlePaymentType3($pv_details);
                    break;
                case 4:
                    $this->handlePaymentType4($pv_details,$AP);
                    break;
            }
        });

        $this->handlePVoucherDetailInsert($pv_details);
    }
    protected function handlePaymentType1(Payment_voucher_detail $pv_details,$DEPSUP,$SUPTADVPAY,$AP){
        $grnNo = Grn_details::where('po_id', $pv_details->po_detail_id)->value('grn_no');
        $supplier_id = Payment_voucher_master::where('pv_number', $pv_details->pv_number)->value('supplier_id');
        if($pv_details->account_code === $DEPSUP){
            POrder_detail::where('id', $pv_details->po_detail_id)->update(['deposit_pv' => $pv_details->pv_number]);
            Grn_accounts_payable::create([
                'grn_no'                => $grnNo,
                'transaction_date'      => $pv_details->pv_date,
                'account_code'          => $DEPSUP,
                'account_description'   => "Deposit To Supplier",
                'product_id'            => $pv_details->product_id,
                'supplier_id'           => $supplier_id,
                'pv_detail_id'          => $pv_details->id,
                'po_detail_id'          => $pv_details->po_detail_id,
                'currency'              => $pv_details->currency,
                'amount'                => $pv_details->amount,
                'base_amount'           => $pv_details->base_amount,
                'debit'                 => $pv_details->base_amount,
                'credit'                => 0
            ]);
        }
        if($pv_details->account_code === $SUPTADVPAY){
            POrder_detail::where('id', $pv_details->po_detail_id)->update(['invoice_pv' => $pv_details->pv_number]);
            Grn_accounts_payable::create([
                'grn_no'                => $grnNo,
                'transaction_date'      => $pv_details->pv_date,
                'account_code'          => $SUPTADVPAY,
                'account_description'   => "Invoice Payment to supplier",
                'product_id'            => $pv_details->product_id,
                'supplier_id'           => $supplier_id,
                'pv_detail_id'          => $pv_details->id,
                'po_detail_id'          => $pv_details->po_detail_id,
                'currency'              => $pv_details->currency,
                'amount'                => $pv_details->amount,
                'base_amount'           => $pv_details->base_amount,
                'debit'                 => $pv_details->base_amount,
                'credit'                => 0
            ]);
        }

        $credit = Grn_accounts_payable::where('grn_no', $grnNo)->where('account_code',$AP)->sum('credit');
        $debit  = Grn_accounts_payable::where('grn_no', $grnNo)->where('account_code',$AP)->sum('debit');
        $balance = $credit - $debit;
        Grn_accounts_payable::where('grn_no', $grnNo)->where('account_code',$AP)->update(['balance' => $balance]);

    }
    protected function handlePaymentType2(Payment_voucher_detail $pv_details){
        $UniqueID1 = 'PVD-' . $pv_details->id;
        $supplier_id = Payment_voucher_master::where('pv_number', $pv_details->pv_number)->value('supplier_id');
        Account_payment_voucher::create([
            'account_code'      => $pv_details->account_code,
            'supplier_id'       => $supplier_id,
            'pv_detail_id'      => $pv_details->id,
            'transaction_date'  => $pv_details->pv_date,
            'pv_number'         => $pv_details->pv_number,
            'currency'          => $pv_details->currency,
            'ex_rate'           => $pv_details->ex_rate,
            'amount'            => $pv_details->amount,
            'base_amount'       => $pv_details->base_amount,
            'debit'             => $pv_details->base_amount,
            'credit'            => 0,
            'pv_unique_id'      => $UniqueID1
        ]);
        General_ledger::create([
            'account_code'      => $pv_details->account_code,
            'transaction_date'  => $pv_details->pv_date,
            'acc_table'         => 'pvoucher_detail',
            'currency'          => $pv_details->currency,
            'ex_rate'           => $pv_details->ex_rate,
            'acc_table_id'      => $UniqueID1,
            'supplier_id'       => $supplier_id,
            'ref_data'          => $pv_details->pv_number,
            'amount'            => $pv_details->amount,
            'debit'             => $pv_details->base_amount,
            'credit'            => 0,
        ]);
    }
    protected function handlePaymentType3(Payment_voucher_detail $pv_details){
        $UniqueID1 = 'PVD-' . $pv_details->id;
        $supplier_id = Payment_voucher_master::where('pv_number', $pv_details->pv_number)->value('supplier_id');
        Account_payment_voucher::create([
            'account_code'      => $pv_details->account_code,
            'supplier_id'       => $supplier_id,
            'pv_detail_id'      => $pv_details->id,
            'transaction_date'  => $pv_details->pv_date,
            'pv_number'         => $pv_details->pv_number,
            'currency'          => $pv_details->currency,
            'ex_rate'           => $pv_details->ex_rate,
            'amount'            => $pv_details->amount,
            'base_amount'       => $pv_details->base_amount,
            'debit'             => $pv_details->base_amount,
            'credit'            => 0,
            'pv_unique_id'      => $UniqueID1
        ]);
        General_ledger::create([
            'account_code'      => $pv_details->account_code,
            'transaction_date'  => $pv_details->pv_date,
            'acc_table'         => 'pvoucher_detail',
            'currency'          => $pv_details->currency,
            'ex_rate'           => $pv_details->ex_rate,
            'acc_table_id'      => $UniqueID1,
            'supplier_id'       => $supplier_id,
            'ref_data'          => $pv_details->pv_number,
            'amount'            => $pv_details->amount,
            'debit'             => $pv_details->base_amount,
            'credit'            => 0,
        ]);
    }
    protected function handlePaymentType4(Payment_voucher_detail $pv_details,$AP){
        $UniqueID1 = 'PVD-' . $pv_details->id;
        $supplier_id = Payment_voucher_master::where('pv_number', $pv_details->pv_number)->value('supplier_id');
        if($pv_details->account_code === $AP){
            Account_payment_voucher::create([
                'account_code'      => $pv_details->account_code,
                'supplier_id'       => $supplier_id,
                'pv_detail_id'      => $pv_details->id,
                'transaction_date'  => $pv_details->pv_date,
                'pv_number'         => $pv_details->pv_number,
                'currency'          => $pv_details->currency,
                'ex_rate'           => $pv_details->ex_rate,
                'amount'            => $pv_details->amount,
                'base_amount'       => $pv_details->base_amount,
                'debit'             => $pv_details->base_amount,
                'credit'            => 0,
                'pv_unique_id'      => $UniqueID1
            ]);
            General_ledger::create([
                'account_code'      => $pv_details->account_code,
                'transaction_date'  => $pv_details->pv_date,
                'acc_table'         => 'pvoucher_detail',
                'currency'          => $pv_details->currency,
                'ex_rate'           => $pv_details->ex_rate,
                'acc_table_id'      => $UniqueID1,
                'supplier_id'       => $supplier_id,
                'ref_data'          => $pv_details->pv_number,
                'amount'            => $pv_details->amount,
                'debit'             => $pv_details->base_amount,
                'credit'            => 0,
            ]);
        }
        else{
            $amount = $pv_details->amount * -1;
            $base_amount = $pv_details->base_amount * -1;
            Account_payment_voucher::create([
                'account_code'      => $pv_details->account_code,
                'supplier_id'       => $supplier_id,
                'pv_detail_id'      => $pv_details->id,
                'transaction_date'  => $pv_details->pv_date,
                'pv_number'         => $pv_details->pv_number,
                'currency'          => $pv_details->currency,
                'ex_rate'           => $pv_details->ex_rate,
                'amount'            => $amount,
                'base_amount'       => $base_amount,
                'debit'             => $base_amount,
                'credit'            => 0,
                'pv_unique_id'      => $UniqueID1
            ]);
            General_ledger::create([
                'account_code'      => $pv_details->account_code,
                'transaction_date'  => $pv_details->pv_date,
                'acc_table'         => 'pvoucher_detail',
                'currency'          => $pv_details->currency,
                'ex_rate'           => $pv_details->ex_rate,
                'acc_table_id'      => $UniqueID1,
                'supplier_id'       => $supplier_id,
                'ref_data'          => $pv_details->pv_number,
                'amount'            => $amount,
                'debit'             => $base_amount,
                'credit'            => 0,
            ]);
        }
    }
    /**
     * Handle the Payment_voucher_detail "updated" event.
    */
    public function updated(Payment_voucher_detail $payment_voucher_detail): void{
        $this->handlePVoucherDetailUpdate($payment_voucher_detail);
    }

    /**
     * Handle the Payment_voucher_detail "deleted" event.
    */
    public function deleted(Payment_voucher_detail $payment_voucher_detail): void{
        //
    }

    /**
     * Handle the Payment_voucher_detail "restored" event.
    */
    public function restored(Payment_voucher_detail $payment_voucher_detail): void{
        //
    }

    /**
     * Handle the Payment_voucher_detail "force deleted" event.
    */
    public function forceDeleted(Payment_voucher_detail $payment_voucher_detail): void{
        //
    }

    function handlePVoucherDetailInsert($pvDetail){
        $accountingSettings = Accounting_settings::whereIn('chart_fix_code', ['AP', 'DEPSUP', 'SUPTADVPAY'])
            ->pluck('account_code', 'chart_fix_code');

        $pvDate = Payment_voucher_master::where('pv_number', $pvDetail->pv_number)->value('pv_date');

        if ($pvDetail->payment_type_id == 1) {
            $uniqueID2 = $pvDetail->id . '-2';

            $accountCode = in_array($pvDetail->account_code, [12404, 12410]) ? 21900 : $pvDetail->account_code;

            General_ledger_v2::create([
                'account_code'     => $accountCode,
                'transaction_date' => $pvDate,
                'acc_table'        => 'pvoucher_detail',
                'currency'         => $pvDetail->currency,
                'ex_rate'          => $pvDetail->ex_rate,
                'amount'           => $pvDetail->amount,
                'debit'            => 0,
                'credit'           => $pvDetail->base_amount,
                'acc_table_id'     => $uniqueID2,
                'supplier_id'      => $pvDetail->account_no,
                'customer_id'      => null,
                'ref_data'         => $pvDetail->pv_number,
            ]);
        }
    }
    function handlePVoucherDetailUpdate($pvDetail){
        if ($pvDetail->payment_type_id != 1) {
            return;
        }

        // Step 1: Get accounting settings and PV Date/Exchange Rate
        $settings = Accounting_settings::whereIn('chart_fix_code', ['AP', 'DEPSUP', 'SUPTADVPAY'])
            ->pluck('account_code', 'chart_fix_code');

        $pvMaster = Payment_voucher_master::where('pv_number', $pvDetail->pv_number)->first(['pv_date', 'ex_rate']);
        if (!$pvMaster) return;

        $uniqueID2 = $pvDetail->id . '-2';
        $baseAmount = $pvDetail->amount * $pvMaster->ex_rate;

        // Step 2: Determine correct Account Code
        $accountCode = in_array($pvDetail->account_code, [12404, 12410]) ? 21900 : $pvDetail->account_code;

        // Step 3: Update ledger entry
        General_ledger_v2::where([
            ['acc_table_id', '=', $uniqueID2],
            ['acc_table', '=', 'pvoucher_detail'],
        ])->update([
            'account_code'     => $accountCode,
            'transaction_date' => $pvMaster->pv_date,
            'amount'           => $pvDetail->amount,
            'debit'            => 0,
            'credit'           => $baseAmount,
        ]);
    }
}
