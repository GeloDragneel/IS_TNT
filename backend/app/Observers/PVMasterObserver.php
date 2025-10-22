<?php

namespace App\Observers;
use App\Models\Payment_voucher_master;
use App\Models\Accounting_settings;
use App\Models\General_ledger;
use App\Models\Account_payment_voucher;
use App\Models\Account_supplier_cn;
use App\Models\Account_supplier_invoice;
use App\Models\Payment_voucher_detail;
use App\Models\Payment_voucher_detail_copy;
use App\Models\Accounts_payable_master;
use App\Models\General_ledger_v2;
use Illuminate\Support\Facades\DB;
class PVMasterObserver
{
    /**
     * Handle the Payment_voucher_master "created" event.
    */
    public function created(Payment_voucher_master $pv){
        DB::transaction(function () use ($pv) {
            // Fetch fixed accounts
            $accounts = Accounting_settings::whereIn('chart_fix_code', [
                'AP', 'EXDIFF', 'BNKCHARGE', 'DEPSUP', 'SUPTADVPAY', 'INPGST', 'CRSUP'
            ])->pluck('account_code', 'chart_fix_code');

            $AP = $accounts['AP'] ?? null;
            $EXDIFFACC = $accounts['EXDIFF'] ?? null;
            $BNKCHARGE = $accounts['BNKCHARGE'] ?? null;
            $DEPSUP = $accounts['DEPSUP'] ?? null;
            $SUPTADVPAY = $accounts['SUPTADVPAY'] ?? null;
            $INPGST = $accounts['INPGST'] ?? null;
            $CRSUP = $accounts['CRSUP'] ?? null;

            // Determine payment type logic
            switch ($pv->payment_type_id) {
                case 1:
                    $this->handlePaymentType1($pv, $BNKCHARGE,$SUPTADVPAY);

                    $CodeUse = Accounting_settings::where('chart_fix_code', $pv->chart_fix_code)->value('account_code');
                    if($CodeUse === $SUPTADVPAY){
                        $newAPInvoiceNo = $pv->invoice_no;
                        $newAPInvoiceNo = rtrim($newAPInvoiceNo, '|');
                        $items = explode('|', $newAPInvoiceNo);

                        // Loop through the items
                        foreach ($items as $item) {
                            $ap_detail = Accounts_payable_master::where('ap_number',$item)->get();
                            foreach($ap_detail as $list){
                                Account_supplier_invoice::create([
                                    'supplier_id'       => $list['supplier_id'],
                                    'account_code'      => $SUPTADVPAY,
                                    'transaction_date'  => $list['ap_date'],
                                    'ap_invoice_no'     => $list['ap_number'],
                                    'ex_rate'           => $list['ex_rate'],
                                    'currency'          => $list['currency'],
                                    'sub_total'         => $list['total'],
                                    'base_sub_total'    => $list['base_total'],
                                    'tax_amount'        => $list['tax_amount'],
                                    'base_tax_amount'   => $list['base_tax_amount'],
                                    'deposit'           => 0,
                                    'base_deposit'      => 0,
                                    'base_amount'       => $list['base_total'],
                                    'amount'            => $list['total'],
                                    'debit'             => $list['total'],
                                    'credit'            => 0,
                                    'pv_number'         => $pv->pv_number,
                                    'pv_detail_id'      => $pv->id,
                                ]);

                                $invoiceNo = $list['ap_number'];
                                $creditUsed = Account_supplier_cn::where('ap_invoice_no', $invoiceNo)->sum('amount') ?? 0;
                                $apInvoiceBalance = Account_supplier_invoice::where('ap_invoice_no', $invoiceNo)->get()->sum(function ($row) {
                                    return ($row->credit ?? 0) - ($row->debit ?? 0);
                                });
                                $apInvoiceAmountToPay = Accounts_payable_master::where('ap_number', $invoiceNo)->sum('total') ?? 0;
                                $apInvoiceBalance2 = $apInvoiceBalance - $creditUsed;

                                $epsilon = 0.00001;

                                if (abs((float) $apInvoiceBalance2) < $epsilon) {
                                    Accounts_payable_master::where('ap_number', $invoiceNo)->update(['invoice_status_id' => 1]);
                                } else if ((float) $apInvoiceBalance2 > 0 && (float) $apInvoiceBalance2 < (float) $apInvoiceAmountToPay - $epsilon) {
                                    Accounts_payable_master::where('ap_number', $invoiceNo)->update(['invoice_status_id' => 3]);
                                } else if (abs((float) $apInvoiceBalance2 - (float) $apInvoiceAmountToPay) < $epsilon) {
                                    Accounts_payable_master::where('ap_number', $invoiceNo)->update(['invoice_status_id' => 2]);
                                } else {
                                    // Fallback / unexpected
                                    \Log::info("PVMasterObserver", [
                                        'ELSE' => 'ELSE',
                                        'apInvoiceBalance2' => $apInvoiceBalance2,
                                        'apInvoiceAmountToPay' => $apInvoiceAmountToPay,
                                    ]);
                                }
                            }
                        }
                    }
                break;
                case 2:
                    $this->handlePaymentType2($pv, $INPGST);
                break;

                case 3:
                    $this->handlePaymentType3($pv);
                break;

                case 4:
                    $this->handlePaymentType4($pv);
                break;
            }
            // Handle Credit Note logic
            if ($pv->credit_used > 0) {
                $this->handlecredit_used($pv, $SUPTADVPAY, $DEPSUP);
            }

            $this->handlePvMasterInsert($pv);
        });
    }
    protected function handlePaymentType1(Payment_voucher_master $pv, $BNKCHARGE,$SUPTADVPAY){
        // Build logic to match your trigger for PaymentType = 1
        // Like inserting into account_paymentvoucher and general_ledger
        // I can help fill this in next
        $bank_charges = $pv->bank_charges;
        $CodeUse = Accounting_settings::where('chart_fix_code', $pv->chart_fix_code)->value('account_code');
        if($bank_charges === 0){

            // FOR UniqueID1
            $UniqueID1 = $pv->id . '-1';
            
            // FOR Account_payment_voucher UniqueID1
            $accPaymentVoucher = Account_payment_voucher::where('pv_unique_id', $UniqueID1)->first();
            if(!$accPaymentVoucher){
                Account_payment_voucher::create([
                    'account_code'      => $CodeUse,
                    'supplier_id'       => $pv->supplier_id,
                    'pv_master_id'      => $pv->id,
                    'transaction_date'  => $pv->pv_date,
                    'pv_number'         => $pv->pv_number,
                    'currency'          => $pv->currency,
                    'ex_rate'           => $pv->ex_rate,
                    'amount'            => $pv->total_amount,
                    'base_amount'       => $pv->base_total_amount,
                    'debit'             => $pv->base_total_amount,
                    'credit'            => 0,
                    'pv_unique_id'      => $UniqueID1
                ]);
            }
            else{
                $accPaymentVoucher->account_code = $CodeUse;
                $accPaymentVoucher->supplier_id = $pv->supplier_id;
                $accPaymentVoucher->pv_master_id = $pv->id;
                $accPaymentVoucher->transaction_date = $pv->pv_date;
                $accPaymentVoucher->pv_number = $pv->pv_number;
                $accPaymentVoucher->currency = $pv->currency;
                $accPaymentVoucher->ex_rate = $pv->ex_rate;
                $accPaymentVoucher->amount = $pv->total_amount;
                $accPaymentVoucher->base_amount = $pv->base_total_amount;
                $accPaymentVoucher->debit = $pv->base_total_amount;
                $accPaymentVoucher->credit = 0;
                $accPaymentVoucher->pv_unique_id = $UniqueID1;
                $accPaymentVoucher->save();
            }

            // FOR General_ledger UniqueID1
            $generalLedger = General_ledger::where('acc_table_id', $UniqueID1)->where('acc_table','pvoucher_master')->first();
            if(!$generalLedger){
                General_ledger::create([
                    'account_code'      => $pv->bank,
                    'transaction_date'  => $pv->pv_date,
                    'acc_table'         => 'pvoucher_master',
                    'currency'          => $pv->currency,
                    'ex_rate'           => $pv->ex_rate,
                    'acc_table_id'      => $UniqueID1,
                    'supplier_id'       => $pv->supplier_id,
                    'ref_data'          => $pv->pv_number,
                    'amount'            => $pv->total_amount,
                    'debit'             => 0,
                    'credit'            => $pv->base_amount,
                ]);
            }
            else{
                $generalLedger->account_code = $pv->bank;
                $generalLedger->transaction_date = $pv->pv_date;
                $generalLedger->acc_table = 'pvoucher_master';
                $generalLedger->currency = $pv->currency;
                $generalLedger->ex_rate = $pv->ex_rate;
                $generalLedger->acc_table_id = $UniqueID1;
                $generalLedger->supplier_id = $pv->supplier_id;
                $generalLedger->ref_data = $pv->pv_number;
                $generalLedger->amount = $pv->total_amount;
                $generalLedger->debit = 0;
                $generalLedger->credit = $pv->base_amount;
                $generalLedger->save();
            }

            // FOR UniqueID2
            $UniqueID2 = $pv->id . '-2';

            // FOR Account_payment_voucher UniqueID2
            $accPaymentVoucher = Account_payment_voucher::where('pv_unique_id', $UniqueID2)->first();
            if(!$accPaymentVoucher){
                Account_payment_voucher::create([
                    'account_code'      => $pv->bank,
                    'supplier_id'       => $pv->supplier_id,
                    'pv_master_id'      => $pv->id,
                    'transaction_date'  => $pv->pv_date,
                    'pv_number'         => $pv->pv_number,
                    'currency'          => $pv->currency,
                    'ex_rate'           => $pv->ex_rate,
                    'amount'            => $pv->total_amount,
                    'base_amount'       => $pv->base_total_amount,
                    'debit'             => 0,
                    'credit'            => $pv->base_total_amount,
                    'pv_unique_id'      => $UniqueID2
                ]);
            }
            else{
                $accPaymentVoucher->account_code = $pv->bank;
                $accPaymentVoucher->supplier_id = $pv->supplier_id;
                $accPaymentVoucher->pv_master_id = $pv->id;
                $accPaymentVoucher->transaction_date = $pv->pv_date;
                $accPaymentVoucher->pv_number = $pv->pv_number;
                $accPaymentVoucher->currency = $pv->currency;
                $accPaymentVoucher->ex_rate = $pv->ex_rate;
                $accPaymentVoucher->amount = $pv->total_amount;
                $accPaymentVoucher->base_amount = $pv->base_total_amount;
                $accPaymentVoucher->debit = 0;
                $accPaymentVoucher->credit = $pv->base_total_amount;
                $accPaymentVoucher->pv_unique_id = $UniqueID2;
                $accPaymentVoucher->save();
            }

            // FOR General_ledger UniqueID2
            $generalLedger = General_ledger::where('acc_table_id', $UniqueID2)->where('acc_table','pvoucher_master')->first();
            if(!$generalLedger){
                General_ledger::create([
                    'account_code'      => $pv->bank,
                    'transaction_date'  => $pv->pv_date,
                    'acc_table'         => 'pvoucher_master',
                    'currency'          => $pv->currency,
                    'ex_rate'           => $pv->ex_rate,
                    'acc_table_id'      => $UniqueID2,
                    'supplier_id'       => $pv->supplier_id,
                    'ref_data'          => $pv->pv_number,
                    'amount'            => $pv->total_amount,
                    'debit'             => $pv->base_amount,
                    'credit'            => 0,
                ]);
            }
            else{
                $generalLedger->account_code = $pv->bank;
                $generalLedger->transaction_date = $pv->pv_date;
                $generalLedger->acc_table = 'pvoucher_master';
                $generalLedger->currency = $pv->currency;
                $generalLedger->ex_rate = $pv->ex_rate;
                $generalLedger->acc_table_id = $UniqueID2;
                $generalLedger->supplier_id = $pv->supplier_id;
                $generalLedger->ref_data = $pv->pv_number;
                $generalLedger->amount = $pv->total_amount;
                $generalLedger->debit = $pv->base_amount;
                $generalLedger->credit = 0;
                $generalLedger->save();
            }
        }
        else{
            // FOR UniqueID0
            $UniqueID0 = $pv->id . '-0';

            // FOR Account_payment_voucher UniqueID0
            $accPaymentVoucher = Account_payment_voucher::where('pv_unique_id', $UniqueID0)->first();
            if(!$accPaymentVoucher){
                Account_payment_voucher::create([
                    'account_code'      => $BNKCHARGE,
                    'supplier_id'       => $pv->supplier_id,
                    'pv_master_id'      => $pv->id,
                    'transaction_date'  => $pv->pv_date,
                    'pv_number'         => $pv->pv_number,
                    'currency'          => $pv->currency,
                    'ex_rate'           => $pv->ex_rate,
                    'amount'            => $pv->bank_charges,
                    'base_amount'       => $pv->base_bank_charges,
                    'debit'             => $pv->base_bank_charges,
                    'credit'            => 0,
                    'pv_unique_id'      => $UniqueID0
                ]);
            }
            else{
                $accPaymentVoucher->account_code = $BNKCHARGE;
                $accPaymentVoucher->supplier_id = $pv->supplier_id;
                $accPaymentVoucher->pv_master_id = $pv->id;
                $accPaymentVoucher->transaction_date = $pv->pv_date;
                $accPaymentVoucher->pv_number = $pv->pv_number;
                $accPaymentVoucher->currency = $pv->currency;
                $accPaymentVoucher->ex_rate = $pv->ex_rate;
                $accPaymentVoucher->amount = $pv->total_amount;
                $accPaymentVoucher->base_amount = $pv->base_total_amount;
                $accPaymentVoucher->debit = $pv->base_total_amount;
                $accPaymentVoucher->credit = 0;
                $accPaymentVoucher->pv_unique_id = $UniqueID0;
                $accPaymentVoucher->save();
            }

            // FOR General_ledger UniqueID0
            $generalLedger = General_ledger::where('acc_table_id', $UniqueID0)->where('acc_table','pvoucher_master')->first();
            if(!$generalLedger){
                General_ledger::create([
                    'account_code'      => $BNKCHARGE,
                    'transaction_date'  => $pv->pv_date,
                    'acc_table'         => 'pvoucher_master',
                    'currency'          => $pv->currency,
                    'ex_rate'           => $pv->ex_rate,
                    'acc_table_id'      => $UniqueID0,
                    'supplier_id'       => $pv->supplier_id,
                    'ref_data'          => $pv->pv_number,
                    'amount'            => $pv->bank_charges,
                    'debit'             => $pv->base_bank_charges,
                    'credit'            => 0
                ]);
            }
            else{
                $generalLedger->account_code = $BNKCHARGE;
                $generalLedger->transaction_date = $pv->pv_date;
                $generalLedger->acc_table = 'pvoucher_master';
                $generalLedger->currency = $pv->currency;
                $generalLedger->ex_rate = $pv->ex_rate;
                $generalLedger->acc_table_id = $UniqueID0;
                $generalLedger->supplier_id = $pv->supplier_id;
                $generalLedger->ref_data = $pv->pv_number;
                $generalLedger->amount = $pv->bank_charges;
                $generalLedger->debit = $pv->base_bank_charges;
                $generalLedger->credit = 0;
                $generalLedger->save();
            }

            // FOR UniqueID1
            $UniqueID1 = $pv->id . '-1';

            // FOR Account_payment_voucher UniqueID1
            $accPaymentVoucher = Account_payment_voucher::where('pv_unique_id', $UniqueID1)->first();
            if(!$accPaymentVoucher){
                Account_payment_voucher::create([
                    'account_code'      => $CodeUse,
                    'supplier_id'       => $pv->supplier_id,
                    'pv_master_id'      => $pv->id,
                    'transaction_date'  => $pv->pv_date,
                    'pv_number'         => $pv->pv_number,
                    'currency'          => $pv->currency,
                    'ex_rate'           => $pv->ex_rate,
                    'amount'            => $pv->total_amount - $pv->bank_charges,
                    'base_amount'       => $pv->base_total_amount - $pv->base_bank_charges,
                    'debit'             => $pv->base_total_amount - $pv->base_bank_charges,
                    'credit'            => 0,
                    'pv_unique_id'      => $UniqueID1
                ]);
            }
            else{
                $accPaymentVoucher->account_code = $CodeUse;
                $accPaymentVoucher->supplier_id = $pv->supplier_id;
                $accPaymentVoucher->pv_master_id = $pv->id;
                $accPaymentVoucher->transaction_date = $pv->pv_date;
                $accPaymentVoucher->pv_number = $pv->pv_number;
                $accPaymentVoucher->currency = $pv->currency;
                $accPaymentVoucher->ex_rate = $pv->ex_rate;
                $accPaymentVoucher->amount = $pv->total_amount - $pv->bank_charges;
                $accPaymentVoucher->base_amount = $pv->base_total_amount - $pv->base_bank_charges;
                $accPaymentVoucher->debit = $pv->base_total_amount - $pv->base_bank_charges;
                $accPaymentVoucher->credit = 0;
                $accPaymentVoucher->pv_unique_id = $UniqueID1;
                $accPaymentVoucher->save();
            }

            // FOR General_ledger UniqueID1
            $generalLedger = General_ledger::where('acc_table_id', $UniqueID1)->where('acc_table','pvoucher_master')->first();
            if(!$generalLedger){
                General_ledger::create([
                    'account_code'      => $CodeUse,
                    'transaction_date'  => $pv->pv_date,
                    'acc_table'         => 'pvoucher_master',
                    'currency'          => $pv->currency,
                    'ex_rate'           => $pv->ex_rate,
                    'acc_table_id'      => $UniqueID1,
                    'supplier_id'       => $pv->supplier_id,
                    'ref_data'          => $pv->pv_number,
                    'amount'            => $pv->total_amount - $pv->bank_charges,
                    'debit'             => 0,
                    'credit'            => $pv->base_amount - $pv->base_bank_charges,
                ]);
            }
            else{
                $generalLedger->account_code = $CodeUse;
                $generalLedger->transaction_date = $pv->pv_date;
                $generalLedger->acc_table = 'pvoucher_master';
                $generalLedger->currency = $pv->currency;
                $generalLedger->ex_rate = $pv->ex_rate;
                $generalLedger->acc_table_id = $UniqueID1;
                $generalLedger->supplier_id = $pv->supplier_id;
                $generalLedger->ref_data = $pv->pv_number;
                $generalLedger->amount = $pv->total_amount - $pv->bank_charges;
                $generalLedger->debit = 0;
                $generalLedger->credit = $pv->base_amount - $pv->base_bank_charges;
                $generalLedger->save();
            }

            // FOR UniqueID2
            $UniqueID2 = $pv->id . '-2';

            // FOR Account_payment_voucher UniqueID2
            $accPaymentVoucher = Account_payment_voucher::where('pv_unique_id', $UniqueID2)->first();
            if(!$accPaymentVoucher){
                Account_payment_voucher::create([
                    'account_code'      => $pv->bank,
                    'supplier_id'       => $pv->supplier_id,
                    'pv_master_id'      => $pv->id,
                    'transaction_date'  => $pv->pv_date,
                    'pv_number'         => $pv->pv_number,
                    'currency'          => $pv->currency,
                    'ex_rate'           => $pv->ex_rate,
                    'amount'            => $pv->total_amount - $pv->bank_charges,
                    'base_amount'       => $pv->base_total_amount - $pv->base_bank_charges,
                    'debit'             => 0,
                    'credit'            => $pv->base_total_amount - $pv->base_bank_charges,
                    'pv_unique_id'      => $UniqueID2
                ]);
            }
            else{
                $accPaymentVoucher->account_code = $pv->bank;
                $accPaymentVoucher->supplier_id = $pv->supplier_id;
                $accPaymentVoucher->pv_master_id = $pv->id;
                $accPaymentVoucher->transaction_date = $pv->pv_date;
                $accPaymentVoucher->pv_number = $pv->pv_number;
                $accPaymentVoucher->currency = $pv->currency;
                $accPaymentVoucher->ex_rate = $pv->ex_rate;
                $accPaymentVoucher->amount = $pv->total_amount - $pv->bank_charges;
                $accPaymentVoucher->base_amount = $pv->base_total_amount - $pv->base_bank_charges;
                $accPaymentVoucher->debit = 0;
                $accPaymentVoucher->credit = $pv->base_total_amount - $pv->base_bank_charges;
                $accPaymentVoucher->pv_unique_id = $UniqueID2;
                $accPaymentVoucher->save();
            }

            // FOR General_ledger UniqueID2
            $generalLedger = General_ledger::where('acc_table_id', $UniqueID2)->where('acc_table','pvoucher_master')->first();
            if(!$generalLedger){
                General_ledger::create([
                    'account_code'      => $pv->bank,
                    'transaction_date'  => $pv->pv_date,
                    'acc_table'         => 'pvoucher_master',
                    'currency'          => $pv->currency,
                    'ex_rate'           => $pv->ex_rate,
                    'acc_table_id'      => $UniqueID2,
                    'supplier_id'       => $pv->supplier_id,
                    'ref_data'          => $pv->pv_number,
                    'amount'            => $pv->total_amount - $pv->bank_charges,
                    'debit'             => $pv->base_amount - $pv->base_bank_charges,
                    'credit'            => 0,
                ]);
            }
            else{
                $generalLedger->account_code = $pv->bank;
                $generalLedger->transaction_date = $pv->pv_date;
                $generalLedger->acc_table = 'pvoucher_master';
                $generalLedger->currency = $pv->currency;
                $generalLedger->ex_rate = $pv->ex_rate;
                $generalLedger->acc_table_id = $UniqueID2;
                $generalLedger->supplier_id = $pv->supplier_id;
                $generalLedger->ref_data = $pv->pv_number;
                $generalLedger->amount = $pv->total_amount - $pv->bank_charges;
                $generalLedger->debit = $pv->base_amount - $pv->base_bank_charges;
                $generalLedger->credit = 0;
                $generalLedger->save();
            }
        }
    }
    protected function handlePaymentType2(Payment_voucher_master $pv, $INPGST){
        $UniqueID1 = $pv->id . '-1';

        $accPaymentVoucher = Account_payment_voucher::where('pv_unique_id', $UniqueID1)->first();
        if($UniqueID1 === 0){
            Account_payment_voucher::create([
                'account_code'      => $pv->bank,
                'supplier_id'       => $pv->supplier_id,
                'pv_master_id'      => $pv->id,
                'transaction_date'  => $pv->pv_date,
                'pv_number'         => $pv->pv_number,
                'currency'          => $pv->currency,
                'ex_rate'           => $pv->ex_rate,
                'amount'            => $pv->total_amount,
                'base_amount'       => $pv->base_total_amount,
                'debit'             => 0,
                'credit'            => $pv->base_total_amount,
                'pv_unique_id'      => $UniqueID1
            ]);
        }
        else{
            $accPaymentVoucher->account_code = $pv->bank;
            $accPaymentVoucher->supplier_id = $pv->supplier_id;
            $accPaymentVoucher->pv_master_id = $pv->id;
            $accPaymentVoucher->transaction_date = $pv->pv_date;
            $accPaymentVoucher->pv_number = $pv->pv_number;
            $accPaymentVoucher->currency = $pv->currency;
            $accPaymentVoucher->ex_rate = $pv->ex_rate;
            $accPaymentVoucher->amount = $pv->total_amount;
            $accPaymentVoucher->base_amount = $pv->base_total_amount;
            $accPaymentVoucher->debit = 0;
            $accPaymentVoucher->credit = $pv->base_total_amount;
            $accPaymentVoucher->pv_unique_id = $UniqueID1;
            $accPaymentVoucher->save();
        }

        $generalLedger = General_ledger::where('acc_table_id', $UniqueID1)->where('acc_table','pvoucher_master')->first();
        if(!$generalLedger){
            General_ledger::create([
                'account_code'      => $pv->bank,
                'transaction_date'  => $pv->pv_date,
                'acc_table'         => 'pvoucher_master',
                'currency'          => $pv->currency,
                'ex_rate'           => $pv->ex_rate,
                'acc_table_id'      => $UniqueID1,
                'supplier_id'       => $pv->supplier_id,
                'ref_data'          => $pv->pv_number,
                'amount'            => $pv->total_amount,
                'debit'             => 0,
                'credit'            => $pv->base_amount,
            ]);
        }
        else{
            $generalLedger->account_code = $pv->bank;
            $generalLedger->transaction_date = $pv->pv_date;
            $generalLedger->acc_table = 'pvoucher_master';
            $generalLedger->currency = $pv->currency;
            $generalLedger->ex_rate = $pv->ex_rate;
            $generalLedger->acc_table_id = $UniqueID1;
            $generalLedger->supplier_id = $pv->supplier_id;
            $generalLedger->ref_data = $pv->pv_number;
            $generalLedger->amount = $pv->total_amount;
            $generalLedger->debit = 0;
            $generalLedger->credit = $pv->base_amount;
            $generalLedger->save();
        }

        if($pv->tax_amount > 0){
            $UniqueID2 = $pv->id . '-2';

            $accPaymentVoucher = Account_payment_voucher::where('pv_unique_id', $UniqueID2)->first();
            if(!$accPaymentVoucher){
                Account_payment_voucher::create([
                    'account_code'      => $INPGST,
                    'supplier_id'       => $pv->supplier_id,
                    'pv_master_id'      => $pv->id,
                    'transaction_date'  => $pv->pv_date,
                    'pv_number'         => $pv->pv_number,
                    'currency'          => $pv->currency,
                    'ex_rate'           => $pv->ex_rate,
                    'amount'            => $pv->tax_amount,
                    'base_amount'       => $pv->base_tax_amount,
                    'debit'             => 0,
                    'credit'            => $pv->base_tax_amount,
                    'pv_unique_id'      => $UniqueID2
                ]);
            }
            else{
                $accPaymentVoucher->account_code = $INPGST;
                $accPaymentVoucher->supplier_id = $pv->supplier_id;
                $accPaymentVoucher->pv_master_id = $pv->id;
                $accPaymentVoucher->transaction_date = $pv->pv_date;
                $accPaymentVoucher->pv_number = $pv->pv_number;
                $accPaymentVoucher->currency = $pv->currency;
                $accPaymentVoucher->ex_rate = $pv->ex_rate;
                $accPaymentVoucher->amount = $pv->tax_amount;
                $accPaymentVoucher->base_amount = $pv->base_tax_amount;
                $accPaymentVoucher->debit = 0;
                $accPaymentVoucher->credit = $pv->base_tax_amount;
                $accPaymentVoucher->pv_unique_id = $UniqueID2;
                $accPaymentVoucher->save();
            }

            $generalLedger = General_ledger::where('acc_table_id', $UniqueID2)->where('acc_table','pvoucher_master')->first();
            if(!$generalLedger){
                General_ledger::create([
                    'account_code'      => $INPGST,
                    'transaction_date'  => $pv->pv_date,
                    'acc_table'         => 'pvoucher_master',
                    'currency'          => $pv->currency,
                    'ex_rate'           => $pv->ex_rate,
                    'acc_table_id'      => $UniqueID2,
                    'supplier_id'       => $pv->supplier_id,
                    'ref_data'          => $pv->pv_number,
                    'amount'            => $pv->tax_amount,
                    'debit'             => 0,
                    'credit'            => $pv->base_tax_amount,
                ]);
            }
            else{
                $generalLedger->account_code = $INPGST;
                $generalLedger->transaction_date = $pv->pv_date;
                $generalLedger->acc_table = 'pvoucher_master';
                $generalLedger->currency = $pv->currency;
                $generalLedger->ex_rate = $pv->ex_rate;
                $generalLedger->acc_table_id = $UniqueID2;
                $generalLedger->supplier_id = $pv->supplier_id;
                $generalLedger->ref_data = $pv->pv_number;
                $generalLedger->amount = $pv->tax_amount;
                $generalLedger->debit = 0;
                $generalLedger->credit = $pv->base_tax_amount;
                $generalLedger->save();
            }
        }
    }
    protected function handlePaymentType3(Payment_voucher_master $pv){
        $UniqueID1 = $pv->id . '-1';

        $accPaymentVoucher = Account_payment_voucher::where('pv_unique_id', $UniqueID1)->first();
        if(!$accPaymentVoucher){
            Account_payment_voucher::create([
                'account_code'      => $pv->bank,
                'customer_id'       => $pv->customer_id,
                'pv_master_id'      => $pv->id,
                'transaction_date'  => $pv->pv_date,
                'pv_number'         => $pv->pv_number,
                'currency'          => $pv->currency,
                'ex_rate'           => $pv->ex_rate,
                'amount'            => $pv->total_amount,
                'base_amount'       => $pv->base_total_amount,
                'debit'             => 0,
                'credit'            => $pv->base_total_amount,
                'pv_unique_id'      => $UniqueID1
            ]);
        }
        else{
            $accPaymentVoucher->account_code = $pv->bank;
            $accPaymentVoucher->customer_id = $pv->customer_id;
            $accPaymentVoucher->pv_master_id = $pv->id;
            $accPaymentVoucher->transaction_date = $pv->pv_date;
            $accPaymentVoucher->pv_number = $pv->pv_number;
            $accPaymentVoucher->currency = $pv->currency;
            $accPaymentVoucher->ex_rate = $pv->ex_rate;
            $accPaymentVoucher->amount = $pv->total_amount;
            $accPaymentVoucher->base_amount = $pv->base_total_amount;
            $accPaymentVoucher->debit = 0;
            $accPaymentVoucher->credit = $pv->base_total_amount;
            $accPaymentVoucher->pv_unique_id = $UniqueID1;
            $accPaymentVoucher->save();
        }

        $generalLedger = General_ledger::where('acc_table_id', $UniqueID1)->where('acc_table','pvoucher_master')->first();
        if(!$generalLedger){
            General_ledger::create([
                'account_code'      => $pv->bank,
                'transaction_date'  => $pv->pv_date,
                'acc_table'         => 'pvoucher_master',
                'currency'          => $pv->currency,
                'ex_rate'           => $pv->ex_rate,
                'acc_table_id'      => $UniqueID1,
                'customer_id'       => $pv->customer_id,
                'ref_data'          => $pv->pv_number,
                'amount'            => $pv->total_amount,
                'debit'             => 0,
                'credit'            => $pv->base_amount,
            ]);
        }
        else{
            $generalLedger->account_code = $pv->bank;
            $generalLedger->transaction_date = $pv->pv_date;
            $generalLedger->acc_table = 'pvoucher_master';
            $generalLedger->currency = $pv->currency;
            $generalLedger->ex_rate = $pv->ex_rate;
            $generalLedger->acc_table_id = $UniqueID1;
            $generalLedger->customer_id = $pv->customer_id;
            $generalLedger->ref_data = $pv->pv_number;
            $generalLedger->amount = $pv->total_amount;
            $generalLedger->debit = 0;
            $generalLedger->credit = $pv->base_amount;
            $generalLedger->save();
        }
    }
    protected function handlePaymentType4(Payment_voucher_master $pv){
        $UniqueID1 = $pv->id . '-1';

        $accPaymentVoucher = Account_payment_voucher::where('pv_unique_id', $UniqueID1)->get();
        if(!$accPaymentVoucher){
            Account_payment_voucher::create([
                'account_code'      => $pv->bank,
                'supplier_id'       => $pv->supplier_id,
                'pv_master_id'      => $pv->id,
                'transaction_date'  => $pv->pv_date,
                'pv_number'         => $pv->pv_number,
                'currency'          => $pv->currency,
                'ex_rate'           => $pv->ex_rate,
                'amount'            => $pv->total_amount,
                'base_amount'       => $pv->base_total_amount,
                'debit'             => 0,
                'credit'            => $pv->base_total_amount,
                'pv_unique_id'      => $UniqueID1
            ]);
        }
        else{
            $accPaymentVoucher->account_code = $pv->bank;
            $accPaymentVoucher->supplier_id = $pv->supplier_id;
            $accPaymentVoucher->pv_master_id = $pv->id;
            $accPaymentVoucher->transaction_date = $pv->pv_date;
            $accPaymentVoucher->pv_number = $pv->pv_number;
            $accPaymentVoucher->currency = $pv->currency;
            $accPaymentVoucher->ex_rate = $pv->ex_rate;
            $accPaymentVoucher->amount = $pv->total_amount;
            $accPaymentVoucher->base_amount = $pv->base_total_amount;
            $accPaymentVoucher->debit = 0;
            $accPaymentVoucher->credit = $pv->base_total_amount;
            $accPaymentVoucher->pv_unique_id = $UniqueID1;
            $accPaymentVoucher->save();
        }

        $generalLedger = General_ledger::where('acc_table_id', $UniqueID1)->where('acc_table','pvoucher_master')->get();
        if(!$generalLedger){
            General_ledger::create([
                'account_code'      => $pv->bank,
                'transaction_date'  => $pv->pv_date,
                'acc_table'         => 'pvoucher_master',
                'currency'          => $pv->currency,
                'ex_rate'           => $pv->ex_rate,
                'acc_table_id'      => $UniqueID1,
                'supplier_id'       => $pv->supplier_id,
                'ref_data'          => $pv->pv_number,
                'amount'            => $pv->total_amount,
                'debit'             => 0,
                'credit'            => $pv->base_amount,
            ]);
        }
        else{
            $generalLedger->account_code = $pv->bank;
            $generalLedger->transaction_date = $pv->pv_date;
            $generalLedger->acc_table = 'pvoucher_master';
            $generalLedger->currency = $pv->currency;
            $generalLedger->ex_rate = $pv->ex_rate;
            $generalLedger->acc_table_id = $UniqueID1;
            $generalLedger->supplier_id = $pv->supplier_id;
            $generalLedger->ref_data = $pv->pv_number;
            $generalLedger->amount = $pv->total_amount;
            $generalLedger->debit = 0;
            $generalLedger->credit = $pv->base_amount;
            $generalLedger->save();
        }
    }
    protected function handlecredit_used(Payment_voucher_master $pv, $SUPTADVPAY, $DEPSUP){
        $now = Carbon::now();

        $curDate = $now->format('ymd') . '-' . $now->format('His'); // e.g. 250826-134512
        $JVNo = 'JV' . $curDate;

        if($pv->chart_fix_code  === 'SUPTADVPAY'){
            $accSupplierCn = Account_supplier_cn::where('pv_detail_id', $pv->id)->first();
            if(!$accSupplierCn){
                Account_supplier_cn::create([
                    'cr_number'         => $JVNo,
                    'account_code'      => 12404,
                    'supplier_id'       => $pv->supplier_id,
                    'currency'          => $pv->currency,
                    'pv_number'         => $pv->pv_number,
                    'ap_invoice_no'     => $pv->invoice_no,
                    'transaction_date'  => $pv->pv_date,
                    'particulars'       => 'Credit Note Deduction~抵扣帐款单',
                    'pv_detail_id'      => $pv->id,
                    'amount'            => $pv->credit_used,
                    'base_amount'       => $pv->credit_used * $pv->ex_rate,
                    'ex_rate'           => $pv->ex_rate,
                    'debit'             => $pv->credit_used,
                    'credit'            => 0,
                    'ref_data'          => $pv->ref_data,
                ]);
            }
            else{
                $accSupplierCn->account_code = 12404;
                $accSupplierCn->supplier_id = $pv->supplier_id;
                $accSupplierCn->currency = $pv->currency;
                $accSupplierCn->pv_number = $$pv->pv_number;
                $accSupplierCn->ap_invoice_no = $pv->invoice_no;
                $accSupplierCn->transaction_date = $pv->pv_date;
                $accSupplierCn->particulars = 'Credit Note Deduction~抵扣帐款单';
                $accSupplierCn->pv_detail_id = $pv->id;
                $accSupplierCn->amount = $pv->credit_used;
                $accSupplierCn->base_amount = $pv->credit_used * $pv->ex_rate;
                $accSupplierCn->ex_rate = $pv->ex_rate;
                $accSupplierCn->debit = $pv->credit_used;
                $accSupplierCn->credit = 0;
                $accSupplierCn->ref_data = $pv->ref_data;
                $accSupplierCn->save();
            }

        }
        if($pv->chart_fix_code  === 'DEPSUP'){
            $accSupplierCn = Account_supplier_cn::where('pv_detail_id', $pv->id)->first();
            if(!$accSupplierCn){
                Account_supplier_cn::create([
                    'cr_number'         => $JVNo,
                    'account_code'      => 12410,
                    'supplier_id'       => $pv->supplier_id,
                    'currency'          => $pv->currency,
                    'pv_number'         => $pv->pv_number,
                    'ap_invoice_no'     => $pv->invoice_no,
                    'transaction_date'  => $pv->pv_date,
                    'particulars'       => 'Credit Note Deduction~抵扣帐款单',
                    'pv_detail_id'      => $pv->id,
                    'amount'            => $pv->credit_used,
                    'base_amount'       => $pv->credit_used * $pv->ex_rate,
                    'ex_rate'           => $pv->ex_rate,
                    'debit'             => $pv->credit_used,
                    'credit'            => 0,
                    'ref_data'          => $pv->ref_data,
                ]);
            }
            else{
                $accSupplierCn->account_code = 12410;
                $accSupplierCn->supplier_id = $pv->supplier_id;
                $accSupplierCn->currency = $pv->currency;
                $accSupplierCn->pv_number = $$pv->pv_number;
                $accSupplierCn->ap_invoice_no = $pv->invoice_no;
                $accSupplierCn->transaction_date = $pv->pv_date;
                $accSupplierCn->particulars = 'Credit Note Deduction~抵扣帐款单';
                $accSupplierCn->pv_detail_id = $pv->id;
                $accSupplierCn->amount = $pv->credit_used;
                $accSupplierCn->base_amount = $pv->credit_used * $pv->ex_rate;
                $accSupplierCn->ex_rate = $pv->ex_rate;
                $accSupplierCn->debit = $pv->credit_used;
                $accSupplierCn->credit = 0;
                $accSupplierCn->ref_data = $pv->ref_data;
                $accSupplierCn->save();
            }
        }
    }
    public function updated(Payment_voucher_master $pv): void {
        DB::transaction(function () use ($pv) {
            if ($pv->pv_status_id === 5) {
                $uniqueIds = [
                    $pv->id . '-0',
                    $pv->id . '-1',
                    $pv->id . '-2',
                    $pv->id . '-3',
                ];
                // Use whereIn to delete all at once
                Account_payment_voucher::whereIn('pv_unique_id', $uniqueIds)->delete();
                General_ledger::whereIn('acc_table_id', $uniqueIds)->where('acc_table','pvoucher_master')->delete();
                Account_supplier_invoice::where('pv_detail_id',$pv->id)->delete();

                // Get all records from pvoucher_detail where pv_number matches
                $details = Payment_voucher_detail::where('pv_number', $pv->pv_number)->get();

                // Prepare data to insert into pvoucher_detail_copy
                $data = $details->map(function ($item) {
                    $array = $item->toArray();
                    unset($array['created_at'], $array['updated_at']); // Remove timestamps
                    return $array;
                });

                // Insert into pvoucher_detail_copy
                Payment_voucher_detail_copy::insert($data->toArray());
                Payment_voucher_detail::where('pv_number',$pv->pv_number)->delete();

                $invoiceNo = $pv['ap_number'];
                $creditUsed = Account_supplier_cn::where('ap_invoice_no', $invoiceNo)->sum('amount') ?? 0;
                $apInvoiceBalance = Account_supplier_invoice::where('ap_invoice_no', $invoiceNo)->get()->sum(function ($row) {
                    return ($row->credit ?? 0) - ($row->debit ?? 0);
                });
                $apInvoiceAmountToPay = Accounts_payable_master::where('ap_number', $invoiceNo)->sum('total') ?? 0;
                $apInvoiceBalance2 = $apInvoiceBalance - $creditUsed;

                $epsilon = 0.00001;

                if (abs((float) $apInvoiceBalance2) < $epsilon) {
                    Accounts_payable_master::where('ap_number', $invoiceNo)->update(['invoice_status_id' => 1]);
                } else if ((float) $apInvoiceBalance2 > 0 && (float) $apInvoiceBalance2 < (float) $apInvoiceAmountToPay - $epsilon) {
                    Accounts_payable_master::where('ap_number', $invoiceNo)->update(['invoice_status_id' => 3]);
                } else if (abs((float) $apInvoiceBalance2 - (float) $apInvoiceAmountToPay) < $epsilon) {
                    Accounts_payable_master::where('ap_number', $invoiceNo)->update(['invoice_status_id' => 2]);
                } else {
                    // Fallback / unexpected
                    \Log::info("PVMasterObserver", [
                        'ELSE' => 'ELSE',
                        'apInvoiceBalance2' => $apInvoiceBalance2,
                        'apInvoiceAmountToPay' => $apInvoiceAmountToPay,
                    ]);
                }

            }
            else{
                // Fetch fixed accounts
                $accounts = Accounting_settings::whereIn('chart_fix_code', [
                    'AP', 'EXDIFF', 'BNKCHARGE', 'DEPSUP', 'SUPTADVPAY', 'INPGST', 'CRSUP'
                ])->pluck('account_code', 'chart_fix_code');

                $AP = $accounts['AP'] ?? null;
                $EXDIFFACC = $accounts['EXDIFF'] ?? null;
                $BNKCHARGE = $accounts['BNKCHARGE'] ?? null;
                $DEPSUP = $accounts['DEPSUP'] ?? null;
                $SUPTADVPAY = $accounts['SUPTADVPAY'] ?? null;
                $INPGST = $accounts['INPGST'] ?? null;
                $CRSUP = $accounts['CRSUP'] ?? null;

                // Determine payment type logic
                switch ($pv->payment_type_id) {
                    case 1:
                        $this->handlePaymentType1($pv, $BNKCHARGE,$SUPTADVPAY);
                    break;
                    case 2:
                        $this->handlePaymentType2($pv, $INPGST);
                    break;
                    case 3:
                        $this->handlePaymentType3($pv);
                    break;
                    case 4:
                        $this->handlePaymentType4($pv);
                    break;
                }
                // Handle Credit Note logic
                if ($pv->credit_used > 0) {
                    $this->handlecredit_used($pv, $SUPTADVPAY, $DEPSUP);
                }
            }

            $this->handlePvMasterUpdate($pv);
        });
    }

    /**
     * Handle the Payment_voucher_master "deleted" event.
    */
    public function deleted(Payment_voucher_master $payment_voucher_master): void{
        //
    }

    /**
     * Handle the Payment_voucher_master "restored" event.
     */
    public function restored(Payment_voucher_master $payment_voucher_master): void{
        //
    }

    /**
     * Handle the Payment_voucher_master "force deleted" event.
     */
    public function forceDeleted(Payment_voucher_master $payment_voucher_master): void{
        //
    }
    function handlePvMasterInsert(PvMaster $newPv){
        // Fetch relevant account codes from accounting_settings
        $settings = Accounting_settings::whereIn('chart_fix_code', [
            'AP', 'EXDIFF', 'BNKCHARGE', 'DEPSUP', 'SUPTADVPAY', 'INPGST'
        ])->pluck('account_code', 'chart_fix_code');

        $AP         = $settings->get('AP');
        $EXDIFFACC  = $settings->get('EXDIFF');
        $BNKCHARGE  = $settings->get('BNKCHARGE');
        $DEPSUP     = $settings->get('DEPSUP');
        $SUPTADVPAY = $settings->get('SUPTADVPAY');
        $INPGST     = $settings->get('INPGST');

        // Compute base amount (truncate behavior approximated via round or floor)
        $baseAmount = round($newPv->total_amount * $newPv->ex_rate, 2);

        // CASE: payment_type_id = 1
        if ($newPv->payment_type_id == 1) {
            // Get the “code use” from settings when chart_fix_code matches
            $codeUse = Accounting_settings::where('chart_fix_code', $newPv->chart_fix_code)->value('account_code');

            // If bank_charges = 0
            if ($newPv->bank_charges == 0) {
                $uniqueID1 = $newPv->id . '-1';
                $uniqueID2 = $newPv->id . '-2';

                $baseCredit = $newPv->credit_used * $newPv->ex_rate;
                $total = $newPv->SubTotal + $newPv->tax_amount + $newPv->credit_used;
                $baseTotal = $newPv->base_sub_total + $newPv->base_tax_amount + $baseCredit;

                General_ledger_v2::create([
                    'account_code'     => $newPv->bank,
                    'transaction_date' => $newPv->pv_date,
                    'acc_table'        => 'pvoucher_master',
                    'currency'         => $newPv->currency,
                    'ex_rate'          => $newPv->ex_rate,
                    'amount'           => $newPv->total_amount + $newPv->credit_used,
                    'debit'            => $baseAmount,
                    'credit'           => 0,
                    'acc_table_id'     => $uniqueID2,
                    'supplier_id'      => $newPv->supplier_id,
                    'customer_id'      => null,
                    'ref_data'         => $newPv->pv_number,
                ]);
            }

            // If bank_charges > 0
            if ($newPv->bank_charges > 0) {
                $uniqueID0 = $newPv->id . '-0';

                General_ledger_v2::create([
                    'account_code'     => $BNKCHARGE,
                    'transaction_date' => $newPv->pv_date,
                    'acc_table'        => 'pvoucher_master',
                    'currency'         => $newPv->currency,
                    'ex_rate'          => $newPv->ex_rate,
                    'amount'           => $newPv->bank_charges,
                    'debit'            => $newPv->base_bank_charges,
                    'credit'           => 0,
                    'acc_table_id'     => $uniqueID0,
                    'supplier_id'      => $newPv->supplier_id,
                    'customer_id'      => null,
                    'ref_data'         => $newPv->pv_number,
                ]);
            }
        }

        // CASE: payment_type_id = 2
        if ($newPv->payment_type_id == 2) {
            $uniqueID1 = $newPv->id . '-1';

            General_ledger_v2::create([
                'account_code'     => $BNKCHARGE,
                'transaction_date' => $newPv->pv_date,
                'acc_table'        => 'pvoucher_master',
                'currency'         => $newPv->currency,
                'ex_rate'          => $newPv->ex_rate,
                'amount'           => $newPv->total_amount,
                'debit'            => $baseAmount,
                'credit'           => 0,
                'acc_table_id'     => $uniqueID1,
                'supplier_id'      => null,
                'customer_id'      => null,
                'pay_to'           => $newPv->pay_to_en,
                'ref_data'         => $newPv->pv_number,
            ]);
        }
    }
    function handlePvMasterUpdate(Payment_voucher_master $newPv){
        // Get accounting settings
        $settings = Accounting_settings::whereIn('chart_fix_code', [
            'AP', 'EXDIFF', 'BNKCHARGE', 'DEPSUP', 'SUPTADVPAY', 'INPGST'
        ])->pluck('account_code', 'chart_fix_code');

        $AP         = $settings->get('AP');
        $EXDIFFACC  = $settings->get('EXDIFF');
        $BNKCHARGE  = $settings->get('BNKCHARGE');
        $DEPSUP     = $settings->get('DEPSUP');
        $SUPTADVPAY = $settings->get('SUPTADVPAY');
        $INPGST     = $settings->get('INPGST');

        // Compute base values
        $baseCredit  = $newPv->credit_used * $newPv->ex_rate;
        $baseAmount  = round($newPv->total_amount * $newPv->ex_rate, 2) + $baseCredit;

        // If pv_status_id != 5
        if ($newPv->pv_status_id != 5) {

            if ($newPv->payment_type_id == 1) {

                $codeUse = Accounting_settings::where('chart_fix_code', $newPv->chart_fix_code)
                            ->value('account_code');

                if ($newPv->bank_charges == 0) {
                    $uniqueID2 = $newPv->id . '-2';

                    $generalLedger = General_ledger_v2::where('acc_table_id', $uniqueID2)->where('acc_table','pvoucher_master')->first();
                    if(!$generalLedger){
                        General_ledger_v2::create([
                            'account_code'     => $newPv->bank,
                            'transaction_date' => $newPv->pv_date,
                            'acc_table'        => 'pvoucher_master',
                            'currency'         => $newPv->currency,
                            'ex_rate'          => $newPv->ex_rate,
                            'amount'           => $newPv->total_amount + $newPv->credit_used,
                            'debit'            => $baseAmount,
                            'credit'           => 0,
                            'acc_table_id'     => $uniqueID2,
                            'supplier_id'      => $newPv->supplier_id,
                            'customer_id'      => null,
                            'ref_data'         => $newPv->pv_number,
                        ]);
                    }
                    else{
                        General_ledger_v2::where('acc_table_id', $uniqueID2)
                        ->where('acc_table', 'pvoucher_master')
                        ->update([
                            'account_code'     => $newPv->bank,
                            'transaction_date' => $newPv->pv_date,
                            'amount'           => $newPv->total_amount + $newPv->credit_used,
                            'credit'           => 0,
                            'debit'            => $baseAmount,
                        ]);
                    }
                }

                if ($newPv->bank_charges > 0) {
                    $uniqueID0 = $newPv->id . '-0';
                    $generalLedger = General_ledger_v2::where('acc_table_id', $uniqueID0)->where('acc_table','pvoucher_master')->first();
                    if(!$generalLedger){
                        General_ledger_v2::create([
                            'account_code'     => $BNKCHARGE,
                            'transaction_date' => $newPv->pv_date,
                            'acc_table'        => 'pvoucher_master',
                            'currency'         => $newPv->currency,
                            'ex_rate'          => $newPv->ex_rate,
                            'amount'           => $newPv->bank_charges,
                            'debit'            => $baseAmount,
                            'credit'           => 0,
                            'acc_table_id'     => $uniqueID0,
                            'supplier_id'      => $newPv->supplier_id,
                            'customer_id'      => null,
                            'ref_data'         => $newPv->pv_number,
                        ]);
                    }
                    else{
                        General_ledger_v2::where('acc_table_id', $uniqueID0)
                        ->where('acc_table', 'pvoucher_master')
                        ->update([
                            'account_code'     => $BNKCHARGE,
                            'transaction_date' => $newPv->pv_date,
                            'amount'           => $newPv->bank_charges,
                            'credit'           => 0,
                            'debit'            => $baseAmount,
                        ]);
                    }
                }

            } elseif ($newPv->payment_type_id == 2) {
                $uniqueID1 = $newPv->id . '-1';
                $generalLedger = General_ledger_v2::where('acc_table_id', $uniqueID1)->where('acc_table','pvoucher_master')->first();
                if(!$generalLedger){
                    General_ledger_v2::create([
                        'account_code'     => $BNKCHARGE,
                        'transaction_date' => $newPv->pv_date,
                        'acc_table'        => 'pvoucher_master',
                        'currency'         => $newPv->currency,
                        'ex_rate'          => $newPv->ex_rate,
                        'amount'           => $newPv->total_amount,
                        'debit'            => $baseAmount,
                        'credit'           => 0,
                        'acc_table_id'     => $uniqueID1,
                        'supplier_id'      => $newPv->supplier_id,
                        'customer_id'      => null,
                        'ref_data'         => $newPv->pv_number,
                    ]);
                }
                else{
                    General_ledger_v2::where('acc_table_id', $uniqueID1)
                    ->where('acc_table', 'pvoucher_master')
                    ->update([
                        'account_code'     => $BNKCHARGE,
                        'transaction_date' => $newPv->pv_date,
                        'amount'           => $newPv->total_amount,
                        'credit'           => 0,
                        'debit'            => $baseAmount,
                    ]);
                }

            }

        } else {
            // If pv_status_id = 5, delete related ledger entries
            General_ledger_v2::where('ref_data', $newPv->pv_number)->delete();
        }
    }

}
