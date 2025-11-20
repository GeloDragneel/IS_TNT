<?php
namespace App\Observers;

use App\Models\Receive_voucher_detail;
use App\Models\Invoice_master;
use App\Models\Accounting_settings;
use App\Models\Account_receive_voucher;
use App\Models\General_ledger;
use App\Models\Accounts_receivable;
use App\Models\Account_customer_cn;
use App\Models\Receive_voucher_master;
use App\Models\Orders;
use App\Models\General_ledger_v2;
use Illuminate\Support\Facades\DB;

class ReceiveVoucherDetailObserver{

    public function created(Receive_voucher_detail $detail){
       $this->handleAfterCreate($detail);
       $this->handleRvDetailInsert($detail);
    }
    public function updated(Receive_voucher_detail $detail){
       $this->handleAfterCreate($detail);
       $this->handleRvDetailUpdate($detail);
    }
    public function deleted(Receive_voucher_detail $detail): void{
        $total_credit_used = Account_customer_cn::where('invoice_no', $detail->invoice_no)->sum('amount') ?? 0;
        $total_invoice_payment = Receive_voucher_detail::where('invoice_no', $detail->invoice_no)->sum('amount_paid') ?? 0;
        $ar_amount = Accounts_receivable::where('invoice_no', $detail->invoice_no)->sum('debit') ?? 0;
        $balance = $ar_amount + $total_credit_used + $total_invoice_payment;
        $arMasterId = Receive_voucher_master::where('rv_number', $detail->rv_number)->value('id');
        $uniqueID = "{$arMasterId}-0";

        // Step 4: Compute balances and update invoice status
        $totalInvoicePayment = Receive_voucher_detail::where('invoice_no', $detail->invoice_no)->sum('amount_paid');
        $aramount = Accounts_receivable::where('invoice_no', $detail->invoice_no)->sum('debit');
        $balance = $aramount - $totalInvoicePayment;

        $status = match (true) {
            $balance <= 0 => 1, // Paid
            $balance == $aramount => 2, // Unpaid
            $balance > 0 => 3, // Partially Paid
        };

        $Invoice_master = Invoice_master::where('invoice_no',$detail->invoice_no)->first();
        if($Invoice_master){
            $Invoice_master->invoice_status_id = $status;
            $Invoice_master->payment = $totalInvoicePayment;
            $Invoice_master->balance = $balance;
            $Invoice_master->save();
        }
        $Accounts_receivable = Accounts_receivable::where('invoice_no',$detail->invoice_no)->first();
        if($Accounts_receivable){
            $Accounts_receivable->amount_paid = $totalInvoicePayment;
            $Accounts_receivable->balance = $balance;
            $Accounts_receivable->save();
        }

        $Orders = Orders::where('product_id',$detail->product_id)
            ->where('customer_id',$detail->customer_id)
            ->where('show_category','orders')
            ->first();

        if($Orders){
            $Orders->order_status = 2;
            $Orders->save();
        }
    }
    public function handleAfterCreate(Receive_voucher_detail $detail){
        // Step 1: Get total voucher and base voucher amounts
        $voucheramount = Invoice_master::where('invoice_no', $detail->invoice_no)->sum('voucher_amount') ?? 0;
        $baseVoucheramount = Invoice_master::where('invoice_no', $detail->invoice_no)->sum('base_voucher_amount') ?? 0;

        // Step 2: Get AR account code and AR master ID
        $araccount_code = Accounting_settings::where('chart_fix_code', 'AR')->value('account_code');
        $arMasterId = Receive_voucher_master::where('rv_number', $detail->rv_number)->value('id');

        $uniqueID = "{$arMasterId}-0";

        // Step 3: Update account code if different from AR
        if ($detail->account_code !== $araccount_code) {
            Account_receive_voucher::where('ar_unique_id', $uniqueID)
                ->update(['account_code' => $detail->account_code]);

            General_ledger::where('acc_table_id', $uniqueID)
                ->where('acc_table', 'rvoucher_master')
                ->update(['account_code' => $detail->account_code]);
        }

        // Step 4: Compute balances and update invoice status
        $totalInvoicePayment = Receive_voucher_detail::where('invoice_no', $detail->invoice_no)->sum('amount_paid');
        $aramount = Accounts_receivable::where('invoice_no', $detail->invoice_no)->sum('debit');
        $balance = $aramount - $totalInvoicePayment;

        if ($voucheramount > 0) {
            General_ledger::create([
                'account_code' => 61306,
                'transaction_date' => $detail->rv_date,
                'acc_table' => 'arinvoice_master',
                'acc_table_id' => $uniqueID,
                'customer_id' => $detail->customer_id,
                'currency' => $detail->currency,
                'ex_rate' => $detail->ex_rate,
                'amount' => $voucheramount,
                'ref_data' => $detail->invoice_no,
                'debit' => $baseVoucheramount,
                'credit' => 0,
            ]);
        }

        $status = match (true) {
            $balance <= 0 => 1, // Paid
            $balance == $aramount => 2, // Unpaid
            $balance > 0 => 3, // Partially Paid
        };

        $Invoice_master = Invoice_master::where('invoice_no',$detail->invoice_no)->first();
        if($Invoice_master){
            $Invoice_master->invoice_status_id = $status;
            $Invoice_master->payment = $totalInvoicePayment;
            $Invoice_master->balance = $balance;
            $Invoice_master->save();
        }

        $Accounts_receivable = Accounts_receivable::where('invoice_no',$detail->invoice_no)->first();
        if($Accounts_receivable){
            $Accounts_receivable->amount_paid = $totalInvoicePayment;
            $Accounts_receivable->balance = $balance;
            $Accounts_receivable->save();
        }

        // Step 6: If account is CUSTADVPAY, insert customer advance payment
        $custAdvPay = Accounting_settings::where('chart_fix_code', 'CUSTADVPAY')->value('account_code');
        if ($detail->account_code == $custAdvPay) {
            $accountCustomerCn = Account_customer_cn::where('rv_detail_id',$detail->id)->first();
            if(!$accountCustomerCn){
                Account_customer_cn::create([
                    'account_code' => $detail->account_code,
                    'customer_id' => $detail->customer_id,
                    'currency' => $detail->currency,
                    'rv_master_id' => $arMasterId,
                    'rv_detail_id' => $detail->id,
                    'ref_data' => $detail->rv_number,
                    'transaction_date' => $detail->rv_date,
                    'particulars' => 'Advance Payment~预付款',
                    'amount' => $detail->amount,
                    'base_amount' => $detail->base_amount,
                    'ex_rate' => $detail->ex_rate,
                    'debit' => 0,
                    'credit' => $detail->amount,
                ]);
            }
            else{
                $accountCustomerCn->account_code = $detail->account_code;
                $accountCustomerCn->customer_id = $detail->customer_id;
                $accountCustomerCn->currency = $detail->currency;
                $accountCustomerCn->rv_master_id = $arMasterId;
                $accountCustomerCn->rv_detail_id = $detail->id;
                $accountCustomerCn->ref_data = $detail->rv_number;
                $accountCustomerCn->transaction_date = $detail->rv_date;
                $accountCustomerCn->particulars = 'Advance Payment~预付款';
                $accountCustomerCn->amount = $detail->amount;
                $accountCustomerCn->base_amount = $detail->base_amount;
                $accountCustomerCn->ex_rate = $detail->ex_rate;
                $accountCustomerCn->debit = 0;
                $accountCustomerCn->credit = $detail->amount;
                $accountCustomerCn->save();
            }
        }
    }
    public function handleRvDetailInsert(Receive_voucher_detail $newDetail){
        // Get account codes from accounting_settings
        $settings = Accounting_settings::whereIn('chart_fix_code', ['AR', 'AP'])->pluck('account_code', 'chart_fix_code');

        $AR = $settings->get('AR');
        $AP = $settings->get('AP');

        // Get master info by rv_number / rv_number
        $rvMaster = Receive_voucher_master::where('rv_number', $newDetail->rv_number)->first();

        if (!$rvMaster) {
            // Master record not found, exit early or throw exception
            return;
        }

        $ARmasterID = $rvMaster->id;
        $UniqueID0 = $ARmasterID . '-0';
        $UniqueID1 = $ARmasterID . '-1';
        $rv_date = $rvMaster->rv_date;
        $ex_rate = $rvMaster->ex_rate;

        // Check if NEW.Acc_Code is under "Other Income" root account 70000
        $isOtherIncome = \DB::table('m_charts_of_account')
            ->where('root_name', 70000)
            ->where('account_code', $newDetail->account_code)
            ->exists();

        if ($isOtherIncome) {

            // Insert debit for bank
            General_ledger_v2::create([
                'account_code' => $rvMaster->bank,
                'transaction_date' => $rv_date,
                'acc_table' => 'rvoucher_master',
                'acc_table_id' => $UniqueID0,
                'customer_id' => $newDetail->customer_id,
                'currency' => $newDetail->currency,
                'ex_rate' => $newDetail->ex_rate,
                'amount' => $newDetail->amount,
                'ref_data' => $newDetail->rv_number,
                'debit' => $newDetail->base_amount,
                'credit' => 0,
            ]);

            // Insert credit for Other Income Account
            General_ledger_v2::create([
                'account_code' => $newDetail->account_code,
                'transaction_date' => $rv_date,
                'acc_table' => 'rvoucher_detail',
                'acc_table_id' => $UniqueID1,
                'customer_id' => $newDetail->customer_id,
                'currency' => $newDetail->currency,
                'ex_rate' => $newDetail->ex_rate,
                'amount' => $newDetail->amount,
                'ref_data' => $newDetail->rv_number,
                'debit' => 0,
                'credit' => $newDetail->base_amount,
            ]);

        } else {

            if ($newDetail->account_code != $AR) {
                $credit = $ex_rate * $newDetail->amount_paid;

                General_ledger_v2::create([
                    'account_code' => $newDetail->account_code,
                    'transaction_date' => $rv_date,
                    'acc_table' => 'rvoucher_detail',
                    'acc_table_id' => $UniqueID0,
                    'customer_id' => $newDetail->customer_id,
                    'currency' => $newDetail->currency,
                    'ex_rate' => $newDetail->ex_rate,
                    'amount' => $newDetail->amount_paid,
                    'ref_data' => $newDetail->rv_number,
                    'debit' => 0,
                    'credit' => $credit,
                ]);
            } else {
                // When Acc_Code = AR, use fixed account 21800 for credit side
                $credit = $ex_rate * $newDetail->amount_paid;

                General_ledger_v2::create([
                    'account_code' => 21800,
                    'transaction_date' => $rv_date,
                    'acc_table' => 'rvoucher_detail',
                    'acc_table_id' => $UniqueID0,
                    'customer_id' => $newDetail->customer_id,
                    'currency' => $newDetail->currency,
                    'ex_rate' => $newDetail->ex_rate,
                    'amount' => $newDetail->amount_paid,
                    'ref_data' => $newDetail->rv_number,
                    'debit' => 0,
                    'credit' => $credit,
                ]);
            }
        }
    }
    public function handleRvDetailUpdate($newDetail){
        // Load AR and AP account codes
        $settings = Accounting_settings::whereIn('chart_fix_code', ['AR', 'AP'])->pluck('account_code', 'chart_fix_code');
        $AR = $settings->get('AR');
        $AP = $settings->get('AP');

        // Get master record for rv_number
        $rvMaster = Receive_voucher_master::where('rv_number', $newDetail->rv_number)->first();
        if (!$rvMaster) {
            // Master not found, exit or handle error
            return;
        }

        $ARmasterID = $rvMaster->id;
        $UniqueID0 = $ARmasterID . '-0';
        $UniqueID1 = $ARmasterID . '-1';
        $rv_date = $rvMaster->rv_date;
        $ex_rate = $rvMaster->ex_rate;
        $bank = $rvMaster->bank; // Assuming bank field exists on master

        // Check if account code is under Other Income (Root_Name = 70000)
        $isOtherIncome = \DB::table('m_charts_of_account')
            ->where('root_name', 70000)
            ->where('account_code', $newDetail->account_code)
            ->exists();

        if ($isOtherIncome) {

            // Update debit side (bank account)
            General_ledger_v2::where('acc_table_id', $UniqueID0)
                ->where('acc_table', 'rvoucher_master')
                ->update([
                    'account_code'     => $bank,
                    'transaction_date' => $rv_date,
                    'amount'          => $newDetail->amount_paid,
                    'debit'           => $newDetail->amount_paid * $newDetail->ex_rate,
                ]);

            // Update credit side (Other Income account)
            General_ledger_v2::where('acc_table_id', $UniqueID1)
                ->where('acc_table', 'rvoucher_master')
                ->update([
                    'account_code'     => $newDetail->account_code,
                    'transaction_date' => $rv_date,
                    'amount'          => $newDetail->amount_paid,
                    'credit'          => $newDetail->amount_paid * $newDetail->ex_rate,
                ]);

        } else {

            $credit = $ex_rate * $newDetail->amount_paid;

            if ($newDetail->account_code != $AR) {

                General_ledger_v2::where('acc_table_id', $UniqueID0)
                    ->where('acc_table', 'rvoucher_master')
                    ->update([
                        'account_code'     => $newDetail->account_code,
                        'transaction_date' => $rv_date,
                        'amount'          => $newDetail->amount_paid,
                        'credit'          => $credit,
                    ]);
            } else {

                General_ledger_v2::where('acc_table_id', $UniqueID0)
                    ->where('acc_table', 'rvoucher_master')
                    ->update([
                        'account_code'     => 21800,
                        'transaction_date' => $rv_date,
                        'amount'          => $newDetail->amount_paid,
                        'credit'          => $credit,
                    ]);
            }
        }
    }
}
?>