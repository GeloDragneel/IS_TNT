<?php

namespace App\Observers;
use Illuminate\Support\Facades\DB;

use App\Models\Invoice_master;
use App\Models\Invoice_detail;
use App\Models\Accounting_settings;
use App\Models\Accounts_receivable;
use App\Models\Receive_voucher_detail;
use App\Models\Account_invoice;
use App\Models\General_ledger;
use App\Models\Account_customer_cn;
use App\Models\Sales_order_master;
use App\Models\Shipout_items;

class CustInvoiceMasterObserver
{
    /**
     * Handle the Invoice_master "created" event.
    */
    public function created(Invoice_master $inv): void{
        $this->saveOnTrigger($inv);
    }

    /**
     * Handle the Invoice_master "updated" event.
    */
    public function updated(Invoice_master $inv): void{
        $this->saveOnTrigger($inv);
    }

    /**
     * Handle the Invoice_master "deleted" event.
    */
    public function deleted(Invoice_master $inv): void{
        //
    }

    /**
     * Handle the Invoice_master "restored" event.
    */
    public function restored(Invoice_master $inv): void{
        //
    }

    /**
     * Handle the Invoice_master "force deleted" event.
    */
    public function forceDeleted(Invoice_master $inv): void{
        //
    }
    public function saveOnTrigger(Invoice_master $inv){
        $accountCodes = Accounting_settings::whereIn('chart_fix_code', [
            'AR', 'CUSTDEP', 'CRCUST', 'SALES', 'CUSTADVPAY', 'CUSTEXCESSPAY', 'COGS', 'INV'
        ])->pluck('account_code', 'chart_fix_code');

        $AR = $accountCodes['AR'];
        $CUSTDEP = $accountCodes['CUSTDEP'];
        $CRCUST = $accountCodes['CRCUST'];
        $SALES = $accountCodes['SALES'];
        $CUSTADVPAY = $accountCodes['CUSTADVPAY'];
        $CUSTEXCESSPAY = $accountCodes['CUSTEXCESSPAY'];
        $COGS = $accountCodes['COGS'];
        $INV = $accountCodes['INV'];

        $sub_total = $inv->sub_total;
        $tax_amount = $inv->tax_amount;
        $total = $inv->total;
        $cr_amount = $inv->cr_amount;
        $adv_amount = $inv->adv_amount;
        $excess_amount = $inv->excess_amount;
        $total_deposit = $inv->total_deposit;
        $total_deduction = $inv->total_deduction;
        $credit_used = $inv->credit_used;
        $total_to_pay = $inv->total_to_pay;

        $base_sub_total = $inv->base_sub_total; 
        $base_tax_amount = $inv->base_tax_amount;
        $base_total = $inv->base_total; 
        $base_cr_amount = $inv->base_cr_amount;
        $base_adv_amount = $inv->base_adv_amount;
        $base_excess_amount = $inv->base_excess_amount;
        $base_total_deposit = $inv->base_total_deposit;
        $base_total_deduction = $inv->base_total_deduction;
        $base_credit_used = $inv->base_credit_used;
        $base_total_to_pay = $inv->base_total_to_pay;

        if($inv->invoice_status_id != 5){

            if ($total_to_pay > 0 || ($total_to_pay = 0 && $credit_used = 0)){
                $amount_paid = 0;
                $balance = 0;
                $accReceivable = Accounts_receivable::where('invoice_id', $inv->id)->first();
                if(!$accReceivable){
                    Accounts_receivable::create([
                        'account_code' => $AR,
                        'transaction_date' => $inv->invoice_date,
                        'account_description' => "A/R Receivables~应收款项",
                        'invoice_no' => $inv->invoice_no,
                        'customer_id' => $inv->customer_id,
                        'invoice_id' => $inv->id,
                        'currency' => $inv->currency,
                        'ex_rate' => $inv->ex_rate,
                        'debit' => $total_to_pay,
                        'credit' => 0,
                        'amount_paid' => $amount_paid,
                        'base_amount' => $base_total_to_pay,
                        'balance' => $balance,
                        'is_trigger' => 0
                    ]);
                }
                else{
                    $accReceivable->account_code = $AR;
                    $accReceivable->transaction_date = $inv->invoice_date;
                    $accReceivable->account_description = "A/R Receivables~应收款项";
                    $accReceivable->invoice_no = $inv->invoice_no;
                    $accReceivable->customer_id = $inv->customer_id;
                    $accReceivable->invoice_id = $inv->id;
                    $accReceivable->currency = $inv->currency;
                    $accReceivable->ex_rate = $inv->ex_rate;
                    $accReceivable->debit = $total_to_pay;
                    $accReceivable->credit = 0;
                    $accReceivable->amount_paid = $amount_paid;
                    $accReceivable->base_amount = $base_total_to_pay;
                    $accReceivable->balance = $balance;
                    $accReceivable->save();
                }

                $sumPayment = Receive_voucher_detail::where('invoice_no', $inv->invoice_no)->sum('amount_paid');
                Accounts_receivable::where('invoice_no', $inv->invoice_no)
                    ->where('invoice_id', '>', 0)
                    ->update([
                        'amount_paid' => $sumPayment,
                        'balance' => $sumPayment > 0 
                            ? \DB::raw('debit - ' . (float) $sumPayment) 
                            : \DB::raw('debit'),
                    ]);

                $UniqueID1 = $inv->id . '-1';
                $accInvoice = Account_invoice::where('ar_unique_id', $UniqueID1)->first();
                if(!$accInvoice){
                    Account_invoice::create([
                        'account_code' => $AR,
                        'transaction_date' => $inv->invoice_date,
                        'invoice_no' => $inv->invoice_no,
                        'customer_id' => $inv->customer_id,
                        'currency' => $inv->currency,
                        'ex_rate' => $inv->ex_rate,
                        'amount' => $total_to_pay,
                        'base_amount' => $base_total_to_pay,
                        'debit' => $base_total_to_pay,
                        'credit' => 0,
                        'ar_invoice_id' => $inv->id,
                        'ar_unique_id' => $UniqueID1
                    ]);
                }
                else{
                    $accInvoice->account_code = $AR;
                    $accInvoice->transaction_date = $inv->invoice_date;
                    $accInvoice->invoice_no = $inv->invoice_no;
                    $accInvoice->customer_id = $inv->customer_id;
                    $accInvoice->currency = $inv->currency;
                    $accInvoice->ex_rate = $inv->ex_rate;
                    $accInvoice->debit = $base_total_to_pay;
                    $accInvoice->credit = 0;
                    $accInvoice->amount = $total_to_pay;
                    $accInvoice->base_amount = $base_total_to_pay;
                    $accInvoice->ar_invoice_id = $inv->id;
                    $accInvoice->ar_unique_id = $UniqueID1;
                    $accInvoice->save();
                }

                $generalLedger = General_ledger::where('acc_table_id', $UniqueID1)->where('acc_table','arinvoice_master')->first();
                if(!$generalLedger){
                    General_ledger::create([
                        'account_code' => $AR,
                        'transaction_date' => $inv->invoice_date,
                        'acc_table' => "arinvoice_master",
                        'currency' => $inv->currency,
                        'ex_rate' => $inv->ex_rate,
                        'acc_table_id' => $UniqueID1,
                        'customer_id' => $inv->customer_id,
                        'ref_data' => $inv->invoice_no,
                        'amount' => $total_to_pay,
                        'debit' => $base_total_to_pay,
                        'credit' => 0
                    ]);
                }
                else{
                    $generalLedger->account_code = $AR;
                    $generalLedger->transaction_date = $inv->invoice_date;
                    $generalLedger->acc_table = "arinvoice_master";
                    $generalLedger->currency = $inv->currency;
                    $generalLedger->ex_rate = $inv->ex_rate;
                    $generalLedger->acc_table_id = $UniqueID1;
                    $generalLedger->customer_id = $inv->customer_id;
                    $generalLedger->ref_data = $inv->invoice_no;
                    $generalLedger->amount = $total_to_pay;
                    $generalLedger->debit = $base_total_to_pay;
                    $generalLedger->credit = 0;
                    $generalLedger->save();
                }

                // FOR CR AMOUNT
                if($cr_amount > 0){
                    $UniqueID2 = $inv->id . '-2';

                    $accInvoice = Account_invoice::where('ar_unique_id', $UniqueID2)->first();
                    if(!$accInvoice){
                        Account_invoice::create([
                            'account_code' => $CRCUST,
                            'transaction_date' => $inv->invoice_date,
                            'invoice_no' => $inv->invoice_no,
                            'customer_id' => $inv->customer_id,
                            'currency' => $inv->currency,
                            'ex_rate' => $inv->ex_rate,
                            'amount' => $cr_amount,
                            'base_amount' => $base_cr_amount,
                            'debit' => $base_cr_amount,
                            'credit' => 0,
                            'ar_invoice_id' => $inv->id,
                            'ar_unique_id' => $UniqueID2
                        ]);
                    }
                    else{
                        $accInvoice->account_code = $CRCUST;
                        $accInvoice->transaction_date = $inv->invoice_date;
                        $accInvoice->invoice_no = $inv->invoice_no;
                        $accInvoice->customer_id = $inv->customer_id;
                        $accInvoice->currency = $inv->currency;
                        $accInvoice->ex_rate = $inv->ex_rate;
                        $accInvoice->debit = $base_cr_amount;
                        $accInvoice->credit = 0;
                        $accInvoice->amount = $cr_amount;
                        $accInvoice->base_amount = $base_cr_amount;
                        $accInvoice->ar_invoice_id = $inv->id;
                        $accInvoice->ar_unique_id = $UniqueID2;
                        $accInvoice->save();
                    }

                    $generalLedger = General_ledger::where('acc_table_id', $UniqueID2)->where('acc_table','arinvoice_master')->first();
                    if(!$generalLedger){
                        General_ledger::create([
                            'account_code' => $CRCUST,
                            'transaction_date' => $inv->invoice_date,
                            'acc_table' => "arinvoice_master",
                            'currency' => $inv->currency,
                            'ex_rate' => $inv->ex_rate,
                            'acc_table_id' => $UniqueID2,
                            'customer_id' => $inv->customer_id,
                            'ref_data' => $inv->invoice_no,
                            'amount' => $cr_amount,
                            'debit' => $base_cr_amount,
                            'credit' => 0
                        ]);
                    }
                    else{
                        $generalLedger->account_code = $CRCUST;
                        $generalLedger->transaction_date = $inv->invoice_date;
                        $generalLedger->acc_table = "arinvoice_master";
                        $generalLedger->currency = $inv->currency;
                        $generalLedger->ex_rate = $inv->ex_rate;
                        $generalLedger->acc_table_id = $UniqueID2;
                        $generalLedger->customer_id = $inv->customer_id;
                        $generalLedger->ref_data = $inv->invoice_no;
                        $generalLedger->amount = $cr_amount;
                        $generalLedger->debit = $base_cr_amount;
                        $generalLedger->credit = 0;
                        $generalLedger->save();
                    }

                    $accountCustomerCn = Account_customer_cn::where('invoice_id', $inv->id)->where('account_code',$CRCUST)->first();
                    if ($accountCustomerCn) {
                        $accountCustomerCn->update([
                            'account_code'      => $CRCUST,
                            'customer_id'       => $inv->customer_id,
                            'currency'          => $inv->currency,
                            'ref_data'          => $inv->invoice_no,
                            'transaction_date'  => $inv->invoice_date,
                            'invoice_id'        => $inv->id,
                            'particulars'       => "Offset Credit Note~抵扣帐款单",
                            'ex_rate'           => $inv->ex_rate,
                            'debit'             => $cr_amount,
                            'credit'            => 0,
                            'amount'            => $cr_amount,
                            'base_amount'       => $base_cr_amount,
                        ]);
                    } else {
                        Account_customer_cn::create([
                            'account_code'      => $CRCUST,
                            'customer_id'       => $inv->customer_id,
                            'currency'          => $inv->currency,
                            'ref_data'          => $inv->invoice_no,
                            'transaction_date'  => $inv->invoice_date,
                            'invoice_id'        => $inv->id,
                            'particulars'       => "Offset Credit Note~抵扣帐款单",
                            'ex_rate'           => $inv->ex_rate,
                            'debit'             => $cr_amount,
                            'credit'            => 0,
                            'amount'            => $cr_amount,
                            'base_amount'       => $base_cr_amount,
                        ]);
                    }
                }

                // FOR ADV AMOUNT
                if($adv_amount > 0){
                    $UniqueID3 = $inv->id . '-3';

                    $accInvoice = Account_invoice::where('ar_unique_id', $UniqueID3)->first();
                    if(!$accInvoice){
                        Account_invoice::create([
                            'account_code' => $CUSTADVPAY,
                            'transaction_date' => $inv->invoice_date,
                            'invoice_no' => $inv->invoice_no,
                            'customer_id' => $inv->customer_id,
                            'currency' => $inv->currency,
                            'ex_rate' => $inv->ex_rate,
                            'amount' => $adv_amount,
                            'base_amount' => $base_adv_amount,
                            'debit' => $base_adv_amount,
                            'credit' => 0,
                            'ar_invoice_id' => $inv->id,
                            'ar_unique_id' => $UniqueID3
                        ]);
                    }
                    else{
                        $accInvoice->account_code = $CUSTADVPAY;
                        $accInvoice->transaction_date = $inv->invoice_date;
                        $accInvoice->invoice_no = $inv->invoice_no;
                        $accInvoice->customer_id = $inv->customer_id;
                        $accInvoice->currency = $inv->currency;
                        $accInvoice->ex_rate = $inv->ex_rate;
                        $accInvoice->debit = $base_adv_amount;
                        $accInvoice->credit = 0;
                        $accInvoice->amount = $adv_amount;
                        $accInvoice->base_amount = $base_adv_amount;
                        $accInvoice->ar_invoice_id = $inv->id;
                        $accInvoice->ar_unique_id = $UniqueID3;
                        $accInvoice->save();
                    }

                    $generalLedger = General_ledger::where('acc_table_id', $UniqueID3)->where('acc_table','arinvoice_master')->first();
                    if(!$generalLedger){
                        General_ledger::create([
                            'account_code' => $CUSTADVPAY,
                            'transaction_date' => $inv->invoice_date,
                            'acc_table' => "arinvoice_master",
                            'currency' => $inv->currency,
                            'ex_rate' => $inv->ex_rate,
                            'acc_table_id' => $UniqueID3,
                            'customer_id' => $inv->customer_id,
                            'ref_data' => $inv->invoice_no,
                            'amount' => $adv_amount,
                            'debit' => $base_adv_amount,
                            'credit' => 0
                        ]);
                    }
                    else{
                        $generalLedger->account_code = $CUSTADVPAY;
                        $generalLedger->transaction_date = $inv->invoice_date;
                        $generalLedger->acc_table = "arinvoice_master";
                        $generalLedger->currency = $inv->currency;
                        $generalLedger->ex_rate = $inv->ex_rate;
                        $generalLedger->acc_table_id = $UniqueID3;
                        $generalLedger->customer_id = $inv->customer_id;
                        $generalLedger->ref_data = $inv->invoice_no;
                        $generalLedger->amount = $adv_amount;
                        $generalLedger->debit = $base_adv_amount;
                        $generalLedger->credit = 0;
                        $generalLedger->save();
                    }

                    $accountCustomerCn = Account_customer_cn::where('invoice_id', $inv->id)->where('account_code',$CUSTADVPAY)->first();
                    if ($accountCustomerCn) {
                        $accountCustomerCn->update([
                            'account_code'      => $CUSTADVPAY,
                            'customer_id'       => $inv->customer_id,
                            'currency'          => $inv->currency,
                            'ref_data'          => $inv->invoice_no,
                            'transaction_date'  => $inv->invoice_date,
                            'invoice_id'        => $inv->id,
                            'particulars'       => "Offset Advance Payment~抵扣预付款",
                            'ex_rate'           => $inv->ex_rate,
                            'debit'             => $adv_amount,
                            'credit'            => 0,
                            'amount'            => $adv_amount,
                            'base_amount'       => $base_adv_amount,
                        ]);
                    } else {
                        Account_customer_cn::create([
                            'account_code'      => $CUSTADVPAY,
                            'customer_id'       => $inv->customer_id,
                            'currency'          => $inv->currency,
                            'ref_data'          => $inv->invoice_no,
                            'transaction_date'  => $inv->invoice_date,
                            'invoice_id'        => $inv->id,
                            'particulars'       => "Offset Advance Payment~抵扣预付款",
                            'ex_rate'           => $inv->ex_rate,
                            'debit'             => $adv_amount,
                            'credit'            => 0,
                            'amount'            => $adv_amount,
                            'base_amount'       => $base_adv_amount,
                        ]);
                    }
                }
                else{
                    $UniqueID3 = $inv->id . '-3';
                    Account_invoice::where('ar_unique_id', $UniqueID3)->delete();
                    General_ledger::where('acc_table', 'arinvoice_master')->where('acc_table_id', $UniqueID3)->delete();
                    Account_customer_cn::where('invoice_id', $inv->id)->where('account_code', $CUSTADVPAY)->delete();
                }

                // FOR EXCESS AMOUNT
                if($excess_amount > 0){
                    $UniqueID4 = $inv->id . '-4';

                    $accInvoice = Account_invoice::where('ar_unique_id', $UniqueID4)->first();
                    if(!$accInvoice){
                        Account_invoice::create([
                            'account_code' => $CUSTEXCESSPAY,
                            'transaction_date' => $inv->invoice_date,
                            'invoice_no' => $inv->invoice_no,
                            'customer_id' => $inv->customer_id,
                            'currency' => $inv->currency,
                            'ex_rate' => $inv->ex_rate,
                            'amount' => $excess_amount,
                            'base_amount' => $base_excess_amount,
                            'debit' => $base_excess_amount,
                            'credit' => 0,
                            'ar_invoice_id' => $inv->id,
                            'ar_unique_id' => $UniqueID4
                        ]);
                    }
                    else{
                        $accInvoice->account_code = $CUSTEXCESSPAY;
                        $accInvoice->transaction_date = $inv->invoice_date;
                        $accInvoice->invoice_no = $inv->invoice_no;
                        $accInvoice->customer_id = $inv->customer_id;
                        $accInvoice->currency = $inv->currency;
                        $accInvoice->ex_rate = $inv->ex_rate;
                        $accInvoice->debit = $base_excess_amount;
                        $accInvoice->credit = 0;
                        $accInvoice->amount = $excess_amount;
                        $accInvoice->base_amount = $base_excess_amount;
                        $accInvoice->ar_invoice_id = $inv->id;
                        $accInvoice->ar_unique_id = $UniqueID4;
                        $accInvoice->save();
                    }

                    $generalLedger = General_ledger::where('acc_table_id', $UniqueID4)->where('acc_table','arinvoice_master')->first();
                    if(!$generalLedger){
                        General_ledger::create([
                            'account_code' => $CUSTEXCESSPAY,
                            'transaction_date' => $inv->invoice_date,
                            'acc_table' => "arinvoice_master",
                            'currency' => $inv->currency,
                            'ex_rate' => $inv->ex_rate,
                            'acc_table_id' => $UniqueID4,
                            'customer_id' => $inv->customer_id,
                            'ref_data' => $inv->invoice_no,
                            'amount' => $excess_amount,
                            'debit' => $base_excess_amount,
                            'credit' => 0
                        ]);
                    }
                    else{
                        $generalLedger->account_code = $CUSTEXCESSPAY;
                        $generalLedger->transaction_date = $inv->invoice_date;
                        $generalLedger->acc_table = "arinvoice_master";
                        $generalLedger->currency = $inv->currency;
                        $generalLedger->ex_rate = $inv->ex_rate;
                        $generalLedger->acc_table_id = $UniqueID4;
                        $generalLedger->customer_id = $inv->customer_id;
                        $generalLedger->ref_data = $inv->invoice_no;
                        $generalLedger->amount = $excess_amount;
                        $generalLedger->debit = $base_excess_amount;
                        $generalLedger->credit = 0;
                        $generalLedger->save();
                    }

                    $accountCustomerCn = Account_customer_cn::where('invoice_id', $inv->id)->where('account_code',$CUSTEXCESSPAY)->first();
                    if ($accountCustomerCn) {
                        $accountCustomerCn->update([
                            'account_code'      => $CUSTEXCESSPAY,
                            'customer_id'       => $inv->customer_id,
                            'currency'          => $inv->currency,
                            'ref_data'          => $inv->invoice_no,
                            'transaction_date'  => $inv->invoice_date,
                            'invoice_id'        => $inv->id,
                            'particulars'       => "Offset Excess Payment~抵扣超额支付款",
                            'ex_rate'           => $inv->ex_rate,
                            'debit'             => $excess_amount,
                            'credit'            => 0,
                            'amount'            => $excess_amount,
                            'base_amount'       => $base_excess_amount,
                        ]);
                    } else {
                        Account_customer_cn::create([
                            'account_code'      => $CUSTEXCESSPAY,
                            'customer_id'       => $inv->customer_id,
                            'currency'          => $inv->currency,
                            'ref_data'          => $inv->invoice_no,
                            'transaction_date'  => $inv->invoice_date,
                            'invoice_id'        => $inv->id,
                            'particulars'       => "Offset Excess Payment~抵扣超额支付款",
                            'ex_rate'           => $inv->ex_rate,
                            'debit'             => $excess_amount,
                            'credit'            => 0,
                            'amount'            => $excess_amount,
                            'base_amount'       => $base_excess_amount,
                        ]);
                    }
                }
                else{
                    $UniqueID4 = $inv->id . '-4';
                    Account_invoice::where('ar_unique_id', $UniqueID4)->delete();
                    General_ledger::where('acc_table', 'arinvoice_master')->where('acc_table_id', $UniqueID4)->delete();
                    Account_customer_cn::where('invoice_id', $inv->id)->where('account_code', $CUSTEXCESSPAY)->delete();
                }

                // FOR DEPOSIT AMOUNT
                if($total_deposit > 0){
                    $UniqueID5 = $inv->id . '-5';

                    $accInvoice = Account_invoice::where('ar_unique_id', $UniqueID5)->first();
                    if(!$accInvoice){
                        Account_invoice::create([
                            'account_code' => $CUSTDEP,
                            'transaction_date' => $inv->invoice_date,
                            'invoice_no' => $inv->invoice_no,
                            'customer_id' => $inv->customer_id,
                            'currency' => $inv->currency,
                            'ex_rate' => $inv->ex_rate,
                            'amount' => $total_deposit,
                            'base_amount' => $base_total_deposit,
                            'debit' => $base_total_deposit,
                            'credit' => 0,
                            'ar_invoice_id' => $inv->id,
                            'ar_unique_id' => $UniqueID5
                        ]);
                    }
                    else{
                        $accInvoice->account_code = $CUSTDEP;
                        $accInvoice->transaction_date = $inv->invoice_date;
                        $accInvoice->invoice_no = $inv->invoice_no;
                        $accInvoice->customer_id = $inv->customer_id;
                        $accInvoice->currency = $inv->currency;
                        $accInvoice->ex_rate = $inv->ex_rate;
                        $accInvoice->debit = $base_total_deposit;
                        $accInvoice->credit = 0;
                        $accInvoice->amount = $total_deposit;
                        $accInvoice->base_amount = $base_total_deposit;
                        $accInvoice->ar_invoice_id = $inv->id;
                        $accInvoice->ar_unique_id = $UniqueID5;
                        $accInvoice->save();
                    }

                    $generalLedger = General_ledger::where('acc_table_id', $UniqueID5)->where('acc_table','arinvoice_master')->first();
                    if(!$generalLedger){
                        General_ledger::create([
                            'account_code' => $CUSTDEP,
                            'transaction_date' => $inv->invoice_date,
                            'acc_table' => "arinvoice_master",
                            'currency' => $inv->currency,
                            'ex_rate' => $inv->ex_rate,
                            'acc_table_id' => $UniqueID5,
                            'customer_id' => $inv->customer_id,
                            'ref_data' => $inv->invoice_no,
                            'amount' => $total_deposit,
                            'debit' => $base_total_deposit,
                            'credit' => 0
                        ]);
                    }
                    else{
                        $generalLedger->account_code = $CUSTDEP;
                        $generalLedger->transaction_date = $inv->invoice_date;
                        $generalLedger->acc_table = "arinvoice_master";
                        $generalLedger->currency = $inv->currency;
                        $generalLedger->ex_rate = $inv->ex_rate;
                        $generalLedger->acc_table_id = $UniqueID5;
                        $generalLedger->customer_id = $inv->customer_id;
                        $generalLedger->ref_data = $inv->invoice_no;
                        $generalLedger->amount = $total_deposit;
                        $generalLedger->debit = $base_total_deposit;
                        $generalLedger->credit = 0;
                        $generalLedger->save();
                    }

                    $accountCustomerCn = Account_customer_cn::where('invoice_id', $inv->id)->where('account_code',$CUSTDEP)->first();
                    if ($accountCustomerCn) {
                        $accountCustomerCn->update([
                            'account_code'      => $CUSTDEP,
                            'customer_id'       => $inv->customer_id,
                            'currency'          => $inv->currency,
                            'ref_data'          => $inv->invoice_no,
                            'transaction_date'  => $inv->invoice_date,
                            'invoice_id'        => $inv->id,
                            'particulars'       => "Offset Customer Deposit~抵扣客户定金",
                            'ex_rate'           => $inv->ex_rate,
                            'debit'             => $total_deposit,
                            'credit'            => 0,
                            'amount'            => $total_deposit,
                            'base_amount'       => $base_total_deposit,
                        ]);
                    } else {
                        Account_customer_cn::create([
                            'account_code'      => $CUSTDEP,
                            'customer_id'       => $inv->customer_id,
                            'currency'          => $inv->currency,
                            'ref_data'          => $inv->invoice_no,
                            'transaction_date'  => $inv->invoice_date,
                            'invoice_id'        => $inv->id,
                            'particulars'       => "Offset Customer Deposit~抵扣客户定金",
                            'ex_rate'           => $inv->ex_rate,
                            'debit'             => $total_deposit,
                            'credit'            => 0,
                            'amount'            => $total_deposit,
                            'base_amount'       => $base_total_deposit,
                        ]);
                    }
                }
                else{
                    $UniqueID5 = $inv->id . '-5';
                    Account_invoice::where('ar_unique_id', $UniqueID5)->delete();
                    General_ledger::where('acc_table', 'arinvoice_master')->where('acc_table_id', $UniqueID5)->delete();
                    Account_customer_cn::where('invoice_id', $inv->id)->where('account_code', $CUSTDEP)->delete();
                }

                // FOR DEDUCTION AMOUNT
                if($total_deduction > 0){
                    $UniqueID6 = $inv->id . '-6';

                    $accInvoice = Account_invoice::where('ar_unique_id', $UniqueID6)->first();
                    if(!$accInvoice){
                        Account_invoice::create([
                            'account_code' => $SALES,
                            'transaction_date' => $inv->invoice_date,
                            'invoice_no' => $inv->invoice_no,
                            'customer_id' => $inv->customer_id,
                            'currency' => $inv->currency,
                            'ex_rate' => $inv->ex_rate,
                            'amount' => $total_deduction,
                            'base_amount' => $base_total_deduction,
                            'debit' => 0,
                            'credit' => $base_total_deduction,
                            'ar_invoice_id' => $inv->id,
                            'ar_unique_id' => $UniqueID6
                        ]);
                    }
                    else{
                        $accInvoice->account_code = $SALES;
                        $accInvoice->transaction_date = $inv->invoice_date;
                        $accInvoice->invoice_no = $inv->invoice_no;
                        $accInvoice->customer_id = $inv->customer_id;
                        $accInvoice->currency = $inv->currency;
                        $accInvoice->ex_rate = $inv->ex_rate;
                        $accInvoice->debit = 0;
                        $accInvoice->credit = $base_total_deduction; 
                        $accInvoice->amount = $total_deduction;
                        $accInvoice->base_amount = $base_total_deduction;
                        $accInvoice->ar_invoice_id = $inv->id;
                        $accInvoice->ar_unique_id = $UniqueID6;
                        $accInvoice->save();
                    }

                    $generalLedger = General_ledger::where('acc_table_id', $UniqueID6)->where('acc_table','arinvoice_master')->first();
                    if(!$generalLedger){
                        General_ledger::create([
                            'account_code' => $SALES,
                            'transaction_date' => $inv->invoice_date,
                            'acc_table' => "arinvoice_master",
                            'currency' => $inv->currency,
                            'ex_rate' => $inv->ex_rate,
                            'acc_table_id' => $UniqueID6,
                            'customer_id' => $inv->customer_id,
                            'ref_data' => $inv->invoice_no,
                            'amount' => $total_deduction,
                            'debit' => $base_total_deduction,
                            'credit' => 0
                        ]);
                    }
                    else{
                        $generalLedger->account_code = $SALES;
                        $generalLedger->transaction_date = $inv->invoice_date;
                        $generalLedger->acc_table = "arinvoice_master";
                        $generalLedger->currency = $inv->currency;
                        $generalLedger->ex_rate = $inv->ex_rate;
                        $generalLedger->acc_table_id = $UniqueID6;
                        $generalLedger->customer_id = $inv->customer_id;
                        $generalLedger->ref_data = $inv->invoice_no;
                        $generalLedger->amount = $total_deduction;
                        $generalLedger->debit = $base_total_deduction;
                        $generalLedger->credit = 0;
                        $generalLedger->save();
                    }
                }
                else{
                    $UniqueID6 = $inv->id . '-6';
                    Account_invoice::where('ar_unique_id', $UniqueID6)->delete();
                    General_ledger::where('acc_table', 'arinvoice_master')->where('acc_table_id', $UniqueID6)->delete();
                }

                // FOR COGS AMOUNT
                if($COGS > 0){
                    $UniqueID7 = $inv->id . '-7';

                    $accInvoice = Account_invoice::where('ar_unique_id', $UniqueID7)->first();
                    if(!$accInvoice){
                        Account_invoice::create([
                            'account_code' => $COGS,
                            'transaction_date' => $inv->invoice_date,
                            'invoice_no' => $inv->invoice_no,
                            'customer_id' => $inv->customer_id,
                            'currency' => $inv->currency,
                            'ex_rate' => $inv->ex_rate,
                            'amount' => $total,
                            'base_amount' => $base_total,
                            'debit' => 0,
                            'credit' => $base_total,
                            'ar_invoice_id' => $inv->id,
                            'ar_unique_id' => $UniqueID7
                        ]);
                    }
                    else{
                        $accInvoice->account_code = $COGS;
                        $accInvoice->transaction_date = $inv->invoice_date;
                        $accInvoice->invoice_no = $inv->invoice_no;
                        $accInvoice->customer_id = $inv->customer_id;
                        $accInvoice->currency = $inv->currency;
                        $accInvoice->ex_rate = $inv->ex_rate;
                        $accInvoice->debit = 0;
                        $accInvoice->credit = $base_total; 
                        $accInvoice->amount = $total;
                        $accInvoice->base_amount = $base_total;
                        $accInvoice->ar_invoice_id = $inv->id;
                        $accInvoice->ar_unique_id = $UniqueID7;
                        $accInvoice->save();
                    }

                    $generalLedger = General_ledger::where('acc_table_id', $UniqueID7)->where('acc_table','arinvoice_master')->first();
                    if(!$generalLedger){
                        General_ledger::create([
                            'account_code' => $COGS,
                            'transaction_date' => $inv->invoice_date,
                            'acc_table' => "arinvoice_master",
                            'currency' => $inv->currency,
                            'ex_rate' => $inv->ex_rate,
                            'acc_table_id' => $UniqueID7,
                            'customer_id' => $inv->customer_id,
                            'ref_data' => $inv->invoice_no,
                            'amount' => $total,
                            'debit' =>  0,
                            'credit' => $base_total
                        ]);
                    }
                    else{
                        $generalLedger->account_code = $COGS;
                        $generalLedger->transaction_date = $inv->invoice_date;
                        $generalLedger->acc_table = "arinvoice_master";
                        $generalLedger->currency = $inv->currency;
                        $generalLedger->ex_rate = $inv->ex_rate;
                        $generalLedger->acc_table_id = $UniqueID7;
                        $generalLedger->customer_id = $inv->customer_id;
                        $generalLedger->ref_data = $inv->invoice_no;
                        $generalLedger->amount = $total;
                        $generalLedger->debit = 0;
                        $generalLedger->credit = $base_total;
                        $generalLedger->save();
                    }
                }
                else{
                    $UniqueID7 = $inv->id . '-7';
                    Account_invoice::where('ar_unique_id', $UniqueID7)->delete();
                    General_ledger::where('acc_table', 'arinvoice_master')->where('acc_table_id', $UniqueID7)->delete();
                }

                // FOR INV AMOUNT
                if($INV > 0){
                    $UniqueID8 = $inv->id . '-8';

                    $accInvoice = Account_invoice::where('ar_unique_id', $UniqueID8)->first();
                    if(!$accInvoice){
                        Account_invoice::create([
                            'account_code' => $INV,
                            'transaction_date' => $inv->invoice_date,
                            'invoice_no' => $inv->invoice_no,
                            'customer_id' => $inv->customer_id,
                            'currency' => $inv->currency,
                            'ex_rate' => $inv->ex_rate,
                            'amount' => $sub_total,
                            'base_amount' => $base_sub_total,
                            'debit' => $base_sub_total,
                            'credit' => 0,
                            'ar_invoice_id' => $inv->id,
                            'ar_unique_id' => $UniqueID8
                        ]);
                    }
                    else{
                        $accInvoice->account_code = $INV;
                        $accInvoice->transaction_date = $inv->invoice_date;
                        $accInvoice->invoice_no = $inv->invoice_no;
                        $accInvoice->customer_id = $inv->customer_id;
                        $accInvoice->currency = $inv->currency;
                        $accInvoice->ex_rate = $inv->ex_rate;
                        $accInvoice->debit = $base_sub_total; 
                        $accInvoice->credit = 0;
                        $accInvoice->amount = $sub_total;
                        $accInvoice->base_amount = $base_sub_total;
                        $accInvoice->ar_invoice_id = $inv->id;
                        $accInvoice->ar_unique_id = $UniqueID8;
                        $accInvoice->save();
                    }

                    $generalLedger = General_ledger::where('acc_table_id', $UniqueID8)->where('acc_table','arinvoice_master')->first();
                    if(!$generalLedger){
                        General_ledger::create([
                            'account_code' => $INV,
                            'transaction_date' => $inv->invoice_date,
                            'acc_table' => "arinvoice_master",
                            'currency' => $inv->currency,
                            'ex_rate' => $inv->ex_rate,
                            'acc_table_id' => $UniqueID8,
                            'customer_id' => $inv->customer_id,
                            'ref_data' => $inv->invoice_no,
                            'amount' => $sub_total,
                            'debit' =>  $base_sub_total,
                            'credit' => 0,
                        ]);
                    }
                    else{
                        $generalLedger->account_code = $INV;
                        $generalLedger->transaction_date = $inv->invoice_date;
                        $generalLedger->acc_table = "arinvoice_master";
                        $generalLedger->currency = $inv->currency;
                        $generalLedger->ex_rate = $inv->ex_rate;
                        $generalLedger->acc_table_id = $UniqueID8;
                        $generalLedger->customer_id = $inv->customer_id;
                        $generalLedger->ref_data = $inv->invoice_no;
                        $generalLedger->amount = $sub_total;
                        $generalLedger->debit = $base_sub_total;
                        $generalLedger->credit = 0;
                        $generalLedger->save();
                    }
                }
                else{
                    $UniqueID8 = $inv->id . '-8';
                    Account_invoice::where('ar_unique_id', $UniqueID8)->delete();
                    General_ledger::where('acc_table', 'arinvoice_master')->where('acc_table_id', $UniqueID8)->delete();
                }
            }
            Sales_order_master::where('so_number',$inv->so_number)->update([
                'invoice_status_id' => 8,
                'invoice_no' => $inv->invoice_no,
            ]);
        }
        else{
            $UniqueID1 = $inv->id . '-1';
            $UniqueID2 = $inv->id . '-2';
            $UniqueID3 = $inv->id . '-3';
            $UniqueID4 = $inv->id . '-4';
            $UniqueID5 = $inv->id . '-5';
            $UniqueID6 = $inv->id . '-6';
            $UniqueID7 = $inv->id . '-7';
            $UniqueID8 = $inv->id . '-8';

            $soid = Sales_order_master::where('so_number', $inv->so_number)->value('id');

            $SOUniqueID1 = $soid . '-1';
            $SOUniqueID2 = $soid . '-2';

            Accounts_receivable::where('invoice_id', $inv->id)->delete();
            Invoice_detail::where('invoice_no', $inv->invoice_no)->delete();

            Account_invoice::where('ar_unique_id', $UniqueID1)->delete();
            Account_invoice::where('ar_unique_id', $UniqueID2)->delete();
            Account_invoice::where('ar_unique_id', $UniqueID3)->delete();
            Account_invoice::where('ar_unique_id', $UniqueID4)->delete();
            Account_invoice::where('ar_unique_id', $UniqueID5)->delete();
            Account_invoice::where('ar_unique_id', $UniqueID6)->delete();
            Account_invoice::where('ar_unique_id', $UniqueID7)->delete();
            Account_invoice::where('ar_unique_id', $UniqueID8)->delete();

            General_ledger::where('acc_table_id', $UniqueID1)->where('acc_table',"arinvoice_master")->delete();
            General_ledger::where('acc_table_id', $UniqueID2)->where('acc_table',"arinvoice_master")->delete();
            General_ledger::where('acc_table_id', $UniqueID3)->where('acc_table',"arinvoice_master")->delete();
            General_ledger::where('acc_table_id', $UniqueID4)->where('acc_table',"arinvoice_master")->delete();
            General_ledger::where('acc_table_id', $UniqueID5)->where('acc_table',"arinvoice_master")->delete();
            General_ledger::where('acc_table_id', $UniqueID6)->where('acc_table',"arinvoice_master")->delete();
            General_ledger::where('acc_table_id', $UniqueID7)->where('acc_table',"arinvoice_master")->delete();
            General_ledger::where('acc_table_id', $UniqueID8)->where('acc_table',"arinvoice_master")->delete();
            General_ledger::where('acc_table_id', $SOUniqueID1)->where('acc_table',"so_detail")->delete();
            General_ledger::where('acc_table_id', $SOUniqueID2)->where('acc_table',"so_detail")->delete();

            Shipout_items::where('invoice_no', $inv->invoice_no)->delete();

            Sales_order_master::where('so_number',$inv->so_number)->update([
                'invoice_status_id' => 5,
                'invoice_no' => ''
            ]);
        }
    }
}
