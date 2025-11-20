<?php

namespace App\Observers;
use App\Models\Receive_voucher_master;
use App\Models\Receive_voucher_detail;
use App\Models\Receive_voucher_detail_copy;
use App\Models\Account_receive_voucher;
use App\Models\General_ledger;
use App\Models\General_ledger_v2;
use App\Models\Account_customer_cn;
use App\Models\Accounting_settings;
use Illuminate\Support\Facades\DB;

class ReceiveVoucherMasterObserver
{
    /**
     * Handle the Receive_voucher_master "created" event.
    */
    public function created(Receive_voucher_master $master){
        $this->handleAfterCreate($master);
        $this->handleRvMasterInsert($master);
    }
    /**
     * Handle the Receive_voucher_master "updated" event.
    */
    public function updated(Receive_voucher_master $rv){
        DB::beginTransaction();

        try {
            if($rv->rv_status_id === 5){
                $uid0 = $rv->id . '-0';
                $uid1 = $rv->id . '-1';
                $uid2 = $rv->id . '-2';
                $uid3 = $rv->id . '-3';
                $uid4 = $rv->id . '-4';

                // 1. Copy details to t_rv_detail_copy
                $details = Receive_voucher_detail::where('rv_number', $rv->rv_number)->get();

                foreach ($details as $detail) {
                    $copy = $detail->replicate();
                    $copy->setTable('t_rv_detail_copy');
                    $copy->save();
                }

                // 2. Delete from rvoucher_detail
                Receive_voucher_detail::where('rv_number', $rv->rv_number)->delete();

                // 3. Delete from account_receivevoucher by ar_unique_id
                Account_receive_voucher::whereIn('ar_unique_id', [$uid0, $uid1, $uid2, $uid3])->delete();

                // 4. Delete from general_ledger by acc_table and acc_table_id
                General_ledger::where('acc_table', 'rvoucher_master')
                    ->whereIn('acc_table_id', [$uid0, $uid1, $uid2, $uid3])
                    ->delete();

                // 5. Delete from account_customer_cn by rv_number
                Account_customer_cn::where('rv_master_id', $rv->id)->delete();

            }
            else{
                $this->handleAfterCreate($rv);
            }

            $this->handleRvMasterUpdate($rv);

            DB::commit();
        }
        catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'token'     => 'Error',
                'Observer'  => 'ReceiveVoucherMasterObserver',
                'message'   => $e->getMessage(),
            ]);
        }
    }
    /**
     * Handle the Receive_voucher_master "deleted" event.
    */
    public function deleted(Receive_voucher_master $rv){
        DB::beginTransaction();
        try {
            $rvId = $rv->id;
            $rvNumber = $rv->rv_number;

            // Generate Unique IDs
            $uids = collect(range(0, 4))->map(fn($i) => "{$rvId}-{$i}")->toArray();

            // 1. Delete related rvoucher_detail entries
            Receive_voucher_detail::where('rv_number', $rvNumber)->delete();

            // 2. Delete from account_customer_cn by rv_master_id
            Account_customer_cn::where('rv_master_id', $rvId)->delete();

            // 3. Delete from account_receivevoucher by ar_unique_id
            Account_receive_voucher::whereIn('ar_unique_id', $uids)->delete();

            // 4. Delete from general_ledger by acc_table and acc_table_id
            General_ledger::where('acc_table', 'rvoucher_master')
                ->whereIn('acc_table_id', $uids)
                ->delete();

            DB::commit();
        }
        catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'token'     => 'Error',
                'Observer'  => 'ReceiveVoucherMasterObserver',
                'message'   => $e->getMessage(),
            ]);
        }
    }
    /**
     * Handle the Receive_voucher_master "restored" event.
    */
    public function restored(Receive_voucher_master $rv): void{
        //
    }
    /**
     * Handle the Receive_voucher_master "force deleted" event.
    */
    public function forceDeleted(Receive_voucher_master $rv): void{
        //
    }
    public function handleAfterCreate(Receive_voucher_master $rv){
        DB::beginTransaction();
        try {
            $accountCodes = Accounting_settings::whereIn('chart_fix_code', [
                'BNKCHARGE', 'EXDIFF', 'CUSTEXCESSPAY', 'AR', 'CRCUST'
            ])->pluck('account_code', 'chart_fix_code');

            $BNKCHARGE = $accountCodes['BNKCHARGE'];
            $EXDIFF = $accountCodes['EXDIFF'];
            $CUSTEXCESSPAY = $accountCodes['CUSTEXCESSPAY'];
            $AR = $accountCodes['AR'];
            $CRCUST = $accountCodes['CRCUST'];

            $uid0 = $rv->id . '-0';

            // 1. AR CREDIT (Account Receive Voucher + GL)
            $accReceiveVoucher = Account_receive_voucher::where('ar_unique_id', $uid0)->first();
            if(!$accReceiveVoucher){
                Account_receive_voucher::create([
                    'rv_master_id' => $rv->id,
                    'rv_number' => $rv->rv_number,
                    'account_code' => $AR,
                    'transaction_date' => $rv->rv_date,
                    'customer_id' => $rv->customer_id,
                    'currency' => $rv->currency,
                    'ex_rate' => $rv->ex_rate,
                    'base_amount' => $rv->base_amount_paid,
                    'amount' => $rv->amount_paid,
                    'ar_unique_id' => $uid0,
                    'debit' => 0,
                    'credit' => $rv->base_amount_paid - $rv->base_bank_charges,
                ]);
            }
            else{
                $accReceiveVoucher->rv_master_id = $rv->id;
                $accReceiveVoucher->rv_number = $rv->rv_number;
                $accReceiveVoucher->account_code = $AR;
                $accReceiveVoucher->transaction_date = $rv->rv_date;
                $accReceiveVoucher->customer_id = $rv->customer_id;
                $accReceiveVoucher->currency = $rv->currency;
                $accReceiveVoucher->ex_rate = $rv->ex_rate;
                $accReceiveVoucher->base_amount = $rv->base_amount_paid;
                $accReceiveVoucher->amount = $rv->amount_paid;
                $accReceiveVoucher->ar_unique_id = $uid0;
                $accReceiveVoucher->debit = 0;
                $accReceiveVoucher->credit = $rv->base_amount_paid - $rv->base_bank_charges;
                $accReceiveVoucher->save();
            }

            $generalLedger = General_ledger::where('acc_table_id', $uid0)->where('acc_table','rvoucher_master')->first();
            if(!$generalLedger){
                General_ledger::create([
                    'account_code' => $AR,
                    'transaction_date' => $rv->rv_date,
                    'acc_table' => 'rvoucher_master',
                    'acc_table_id' => $uid0,
                    'customer_id' => $rv->customer_id,
                    'currency' => $rv->currency,
                    'ex_rate' => $rv->ex_rate,
                    'amount' => $rv->amount_paid - $rv->bank_charges,
                    'ref_data' => $rv->rv_number,
                    'debit' => 0,
                    'credit' => $rv->base_amount_paid - $rv->base_bank_charges,
                ]);
            }
            else{
                $generalLedger->account_code = $AR;
                $generalLedger->transaction_date = $rv->rv_date;
                $generalLedger->acc_table = 'rvoucher_master';
                $generalLedger->acc_table_id = $uid0;
                $generalLedger->customer_id = $rv->customer_id;
                $generalLedger->currency = $rv->currency;
                $generalLedger->ex_rate = $rv->ex_rate;
                $generalLedger->amount = $rv->amount_paid - $rv->bank_charges;
                $generalLedger->ref_data = $rv->rv_number;
                $generalLedger->debit = 0;
                $generalLedger->credit = $rv->base_amount_paid - $rv->base_bank_charges;
                $generalLedger->save();
            }

            // 2. BANK DEBIT
            $uid1 = $rv->id . '-1';
            $accReceiveVoucher = Account_receive_voucher::where('ar_unique_id', $uid1)->first();
            if(!$accReceiveVoucher){
                Account_receive_voucher::create([
                    'rv_master_id' => $rv->id,
                    'rv_number' => $rv->rv_number,
                    'account_code' => $rv->bank,
                    'transaction_date' => $rv->rv_date,
                    'customer_id' => $rv->customer_id,
                    'currency' => $rv->currency,
                    'ex_rate' => $rv->ex_rate,
                    'base_amount' => $rv->base_amount_paid,
                    'amount' => $rv->amount_paid,
                    'ar_unique_id' => $uid1,
                    'debit' => $rv->base_amount_paid - $rv->base_bank_charges,
                    'credit' => 0,
                ]);
            }
            else{
                $accReceiveVoucher->rv_master_id = $rv->id;
                $accReceiveVoucher->account_code = $rv->bank;
                $accReceiveVoucher->transaction_date = $rv->rv_date;
                $accReceiveVoucher->customer_id = $rv->customer_id;
                $accReceiveVoucher->currency = $rv->currency;
                $accReceiveVoucher->ex_rate = $rv->ex_rate;
                $accReceiveVoucher->base_amount = $rv->base_amount_paid;
                $accReceiveVoucher->amount = $rv->amount_paid;
                $accReceiveVoucher->ar_unique_id = $uid1;
                $accReceiveVoucher->debit = $rv->base_amount_paid - $rv->base_bank_charges;
                $accReceiveVoucher->credit = 0;
                $accReceiveVoucher->save();
            }

            $generalLedger = General_ledger::where('acc_table_id', $uid1)->where('acc_table','rvoucher_master')->first();
            if(!$generalLedger){
                General_ledger::create([
                    'account_code' => $rv->bank,
                    'transaction_date' => $rv->rv_date,
                    'acc_table' => 'rvoucher_master',
                    'acc_table_id' => $uid1,
                    'customer_id' => $rv->customer_id,
                    'currency' => $rv->currency,
                    'ex_rate' => $rv->ex_rate,
                    'amount' => $rv->amount_paid - $rv->bank_charges,
                    'ref_data' => $rv->rv_number,
                    'debit' => $rv->base_amount_paid - $rv->base_bank_charges,
                    'credit' => 0,
                ]);
            }
            else{
                $generalLedger->account_code = $rv->bank;
                $generalLedger->transaction_date = $rv->rv_date;
                $generalLedger->acc_table = 'rvoucher_master';
                $generalLedger->acc_table_id = $uid1;
                $generalLedger->customer_id = $rv->customer_id;
                $generalLedger->currency = $rv->currency;
                $generalLedger->ex_rate = $rv->ex_rate;
                $generalLedger->amount = $rv->amount_paid - $rv->bank_charges;
                $generalLedger->ref_data = $rv->rv_number;
                $generalLedger->debit = $rv->base_amount_paid - $rv->base_bank_charges;
                $generalLedger->credit = 0;
                $generalLedger->save();
            }

            // 3. BANK CHARGES (if > 0)
            if ($rv->base_bank_charges > 0) {
                $uid2 = $rv->id . '-2';
                $accReceiveVoucher = Account_receive_voucher::where('ar_unique_id', $uid2)->first();
                if(!$accReceiveVoucher){
                    Account_receive_voucher::create([
                        'rv_master_id' => $rv->id,
                        'rv_number' => $rv->rv_number,
                        'account_code' => $BNKCHRG,
                        'transaction_date' => $rv->rv_date,
                        'customer_id' => $rv->customer_id,
                        'currency' => $rv->currency,
                        'ex_rate' => $rv->ex_rate,
                        'base_amount' => $rv->base_bank_charges,
                        'amount' => $rv->bank_charges,
                        'ar_unique_id' => $uid2,
                        'debit' => $rv->base_bank_charges,
                        'credit' => 0,
                    ]);
                }
                else{
                    $accReceiveVoucher->rv_master_id = $rv->id;
                    $accReceiveVoucher->account_code = $BNKCHRG;
                    $accReceiveVoucher->transaction_date = $rv->rv_date;
                    $accReceiveVoucher->customer_id = $rv->customer_id;
                    $accReceiveVoucher->currency = $rv->currency;
                    $accReceiveVoucher->ex_rate = $rv->ex_rate;
                    $accReceiveVoucher->base_amount = $rv->base_bank_charges;
                    $accReceiveVoucher->amount = $rv->bank_charges;
                    $accReceiveVoucher->ar_unique_id = $uid2;
                    $accReceiveVoucher->debit = $rv->base_bank_charges;
                    $accReceiveVoucher->credit = 0;
                    $accReceiveVoucher->save();
                }
                $generalLedger = General_ledger::where('acc_table_id', $uid2)->where('acc_table','rvoucher_master')->first();
                if(!$generalLedger){
                    General_ledger::create([
                        'account_code' => $BNKCHRG,
                        'transaction_date' => $rv->rv_date,
                        'acc_table' => 'rvoucher_master',
                        'acc_table_id' => $uid2,
                        'customer_id' => $rv->customer_id,
                        'currency' => $rv->currency,
                        'ex_rate' => $rv->ex_rate,
                        'amount' => $rv->bank_charges,
                        'ref_data' => $rv->rv_number,
                        'debit' => $rv->base_bank_charges,
                        'credit' => 0,
                    ]);
                }
                else{
                    $generalLedger->account_code = $BNKCHRG;
                    $generalLedger->transaction_date = $rv->rv_date;
                    $generalLedger->acc_table = 'rvoucher_master';
                    $generalLedger->acc_table_id = $uid2;
                    $generalLedger->customer_id = $rv->customer_id;
                    $generalLedger->currency = $rv->currency;
                    $generalLedger->ex_rate = $rv->ex_rate;
                    $generalLedger->amount = $rv->bank_charges;
                    $generalLedger->ref_data = $rv->rv_number;
                    $generalLedger->debit = $rv->base_bank_charges;
                    $generalLedger->credit = 0;
                    $generalLedger->save();
                }
            }

            // 4. EXCHANGE DIFFERENCE
            if ($rv->base_ex_rate_diff != 0) {
                $uid3 = $rv->id . '-3';
                $diff = abs($rv->base_ex_rate_diff);

                if ($rv->base_ex_rate_diff > 0) {

                    $accReceiveVoucher = Account_receive_voucher::where('ar_unique_id', $uid3)->first();
                    if(!$accReceiveVoucher){
                        Account_receive_voucher::create([
                            'rv_master_id' => $rv->id,
                            'rv_number' => $rv->rv_number,
                            'account_code' => $EXDIFF,
                            'transaction_date' => $rv->rv_date,
                            'customer_id' => $rv->customer_id,
                            'currency' => $rv->currency,
                            'ex_rate' => $rv->ex_rate,
                            'base_amount' => $rv->base_ex_rate_diff,
                            'amount' => $rv->base_ex_rate_diff,
                            'ar_unique_id' => $uid3,
                            'debit' => $rv->base_ex_rate_diff,
                            'credit' => 0,
                        ]);
                    }
                    else{
                        $accReceiveVoucher->rv_master_id = $rv->id;
                        $accReceiveVoucher->account_code = $EXDIFF;
                        $accReceiveVoucher->transaction_date = $rv->rv_date;
                        $accReceiveVoucher->customer_id = $rv->customer_id;
                        $accReceiveVoucher->currency = $rv->currency;
                        $accReceiveVoucher->ex_rate = $rv->ex_rate;
                        $accReceiveVoucher->base_amount = $rv->base_ex_rate_diff;
                        $accReceiveVoucher->amount = $rv->base_ex_rate_diff;
                        $accReceiveVoucher->ar_unique_id = $uid3;
                        $accReceiveVoucher->debit = $rv->base_ex_rate_diff;
                        $accReceiveVoucher->credit = 0;
                        $accReceiveVoucher->save();
                    }

                    $generalLedger = General_ledger::where('acc_table_id', $uid3)->where('acc_table','rvoucher_master')->first();
                    if(!$generalLedger){
                        General_ledger::create([
                            'account_code' => $EXDIFF,
                            'transaction_date' => $rv->rv_date,
                            'acc_table' => 'rvoucher_master',
                            'acc_table_id' => $uid3,
                            'customer_id' => $rv->customer_id,
                            'currency' => $rv->currency,
                            'ex_rate' => $rv->ex_rate,
                            'amount' => $rv->base_ex_rate_diff,
                            'ref_data' => $rv->rv_number,
                            'debit' => $rv->base_ex_rate_diff,
                            'credit' => 0,
                        ]); 
                    }
                    else{
                        $generalLedger->account_code = $EXDIFF;
                        $generalLedger->transaction_date = $rv->rv_date;
                        $generalLedger->acc_table = 'rvoucher_master';
                        $generalLedger->acc_table_id = $uid3;
                        $generalLedger->customer_id = $rv->customer_id;
                        $generalLedger->currency = $rv->currency;
                        $generalLedger->ex_rate = $rv->ex_rate;
                        $generalLedger->amount = $rv->base_ex_rate_diff;
                        $generalLedger->ref_data = $rv->rv_number;
                        $generalLedger->debit = $rv->base_ex_rate_diff;
                        $generalLedger->credit = 0;
                        $generalLedger->save();
                    }

                } else {

                    $accReceiveVoucher = Account_receive_voucher::where('ar_unique_id', $uid3)->first();
                    if(!$accReceiveVoucher){
                        Account_receive_voucher::create([
                            'rv_master_id' => $rv->id,
                            'rv_number' => $rv->rv_number,
                            'account_code' => $EXDIFF,
                            'transaction_date' => $rv->rv_date,
                            'customer_id' => $rv->customer_id,
                            'currency' => $rv->currency,
                            'ex_rate' => $rv->ex_rate,
                            'base_amount' => $rv->base_ex_rate_diff,
                            'amount' => 0,
                            'ar_unique_id' => $uid3,
                            'debit' => 0,
                            'credit' => $diff,
                        ]);
                    }
                    else{
                        $accReceiveVoucher->rv_master_id = $rv->id;
                        $accReceiveVoucher->account_code = $EXDIFF;
                        $accReceiveVoucher->transaction_date = $rv->rv_date;
                        $accReceiveVoucher->customer_id = $rv->customer_id;
                        $accReceiveVoucher->currency = $rv->currency;
                        $accReceiveVoucher->ex_rate = $rv->ex_rate;
                        $accReceiveVoucher->base_amount = $rv->base_ex_rate_diff;
                        $accReceiveVoucher->amount = 0;
                        $accReceiveVoucher->ar_unique_id = $uid3;
                        $accReceiveVoucher->debit = 0;
                        $accReceiveVoucher->credit = $diff;
                        $accReceiveVoucher->save();
                    }
                    $generalLedger = General_ledger::where('acc_table_id', $uid3)->where('acc_table','rvoucher_master')->first();
                    if(!$generalLedger){
                        General_ledger::create([
                            'account_code' => $EXDIFF,
                            'transaction_date' => $rv->rv_date,
                            'acc_table' => 'rvoucher_master',
                            'acc_table_id' => $uid3,
                            'customer_id' => $rv->customer_id,
                            'currency' => $rv->currency,
                            'ex_rate' => $rv->ex_rate,
                            'amount' => $diff,
                            'ref_data' => $rv->rv_number,
                            'debit' => 0,
                            'credit' => $diff,
                        ]);
                    }
                    else{
                        $generalLedger->account_code = $EXDIFF;
                        $generalLedger->transaction_date = $rv->rv_date;
                        $generalLedger->acc_table = 'rvoucher_master';
                        $generalLedger->acc_table_id = $uid3;
                        $generalLedger->customer_id = $rv->customer_id;
                        $generalLedger->currency = $rv->currency;
                        $generalLedger->ex_rate = $rv->ex_rate;
                        $generalLedger->amount = $diff;
                        $generalLedger->ref_data = $rv->rv_number;
                        $generalLedger->debit = 0;
                        $generalLedger->credit = $diff;
                        $generalLedger->save();
                    }
                }
            }

            // 5. EXCESS PAYMENT
            if ($rv->excess_amount > 0) {
                $uid4 = $rv->id . '-4';
                $accReceiveVoucher = Account_receive_voucher::where('ar_unique_id', $uid4)->first();
                if(!$accReceiveVoucher){
                    Account_receive_voucher::create([
                        'rv_master_id' => $rv->id,
                        'rv_number' => $rv->rv_number,
                        'account_code' => $CUSTEXCESSPAY,
                        'transaction_date' => $rv->rv_date,
                        'customer_id' => $rv->customer_id,
                        'currency' => $rv->currency,
                        'ex_rate' => $rv->ex_rate,
                        'base_amount' => $rv->base_excess_amount,
                        'amount' => $rv->excess_amount,
                        'ar_unique_id' => $uid4,
                        'debit' => 0,
                        'credit' => $rv->base_excess_amount,
                    ]);
                }
                else{
                    $accReceiveVoucher->rv_master_id = $rv->id;
                    $accReceiveVoucher->account_code = $CUSTEXCESSPAY;
                    $accReceiveVoucher->transaction_date = $rv->rv_date;
                    $accReceiveVoucher->customer_id = $rv->customer_id;
                    $accReceiveVoucher->currency = $rv->currency;
                    $accReceiveVoucher->ex_rate = $rv->ex_rate;
                    $accReceiveVoucher->base_amount = $rv->base_excess_amount;
                    $accReceiveVoucher->amount = $rv->excess_amount;
                    $accReceiveVoucher->ar_unique_id = $uid4;
                    $accReceiveVoucher->debit = 0;
                    $accReceiveVoucher->credit = $rv->base_excess_amount;
                    $accReceiveVoucher->save();
                }
                $generalLedger = General_ledger::where('acc_table_id', $uid4)->where('acc_table','rvoucher_master')->first();
                if(!$generalLedger){
                    General_ledger::create([
                        'account_code' => $CUSTEXCESSPAY,
                        'transaction_date' => $rv->rv_date,
                        'acc_table' => 'rvoucher_master',
                        'acc_table_id' => $uid4,
                        'customer_id' => $rv->customer_id,
                        'currency' => $rv->currency,
                        'ex_rate' => $rv->ex_rate,
                        'amount' => $rv->excess_amount,
                        'ref_data' => $rv->rv_number,
                        'debit' => 0,
                        'credit' => $rv->base_excess_amount,
                    ]);
                }
                else{
                    $generalLedger->account_code = $CUSTEXCESSPAY;
                    $generalLedger->transaction_date = $rv->rv_date;
                    $generalLedger->acc_table = 'rvoucher_master';
                    $generalLedger->acc_table_id = $uid4;
                    $generalLedger->customer_id = $rv->customer_id;
                    $generalLedger->currency = $rv->currency;
                    $generalLedger->ex_rate = $rv->ex_rate;
                    $generalLedger->amount = $rv->excess_amount;
                    $generalLedger->ref_data = $rv->rv_number;
                    $generalLedger->debit = 0;
                    $generalLedger->credit = $rv->base_excess_amount;
                    $generalLedger->save();
                }

                $accountCustomerCn = General_ledger::where('rv_master_id', $rv->id)->where('particulars','Excess Payment~超额款')->first();
                if(!$accountCustomerCn){
                    Account_customer_cn::create([
                        'account_code' => $CUSTEXCESSPAY,
                        'customer_id' => $rv->customer_id,
                        'amount' => $rv->excess_amount,
                        'base_amount' => $rv->base_excess_amount,
                        'debit' => 0,
                        'credit' => $rv->excess_amount,
                        'cr_detail_id' => 0,
                        'rv_master_id' => $rv->id,
                        'transaction_date' => $rv->rv_date,
                        'particulars' => 'Excess Payment~超额款',
                        'currency' => $rv->currency,
                        'ex_rate' => $rv->ex_rate,
                        'rv_detail_id' => 0,
                        'ref_data' => $rv->rv_number,
                    ]);
                }
                else{
                    $accountCustomerCn->account_code = $CUSTEXCESSPAY;
                    $accountCustomerCn->customer_id = $rv->customer_id;
                    $accountCustomerCn->amount = $rv->excess_amount;
                    $accountCustomerCn->base_amount = $rv->base_excess_amount;
                    $accountCustomerCn->debit = 0;
                    $accountCustomerCn->credit = $rv->excess_amount;
                    $accountCustomerCn->cr_detail_id = 0;
                    $accountCustomerCn->rv_master_id = $rv->id;
                    $accountCustomerCn->transaction_date = $rv->rv_date;
                    $accountCustomerCn->particulars = 'Excess Payment~超额款';
                    $accountCustomerCn->currency = $rv->currency;
                    $accountCustomerCn->ex_rate = $rv->ex_rate;
                    $accountCustomerCn->rv_detail_id = 0;
                    $accountCustomerCn->ref_data = $rv->ref_data;
                    $accountCustomerCn->save();
                }
            }

            DB::commit();
        }
        catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'token'     => 'Error',
                'Observer'  => 'ReceiveVoucherMasterObserver',
                'message'   => $e->getMessage(),
            ]);
        }
    }
    public function handleRvMasterInsert($rvMaster){
        // Get account codes by ChartFixCode in one query to optimize
        $settings = Accounting_settings::whereIn('chart_fix_code', [
            'BNKCHARGE', 'EXDIFF', 'CUSTEXCESSPAY', 'AR', 'AP', 'CRCUST'
        ])->pluck('account_code', 'chart_fix_code');

        $BNKCHRG = $settings->get('BNKCHARGE');
        $EXDIFF = $settings->get('EXDIFF');
        $CUSTEXCESSPAY = $settings->get('CUSTEXCESSPAY');
        $AR = $settings->get('AR');
        $AP = $settings->get('AP');
        $CRCUST = $settings->get('CRCUST');

        $UniqueID1 = $rvMaster->id . '-1';

        // Check if Acc_Code (account_code) is under Other Income (root_name = 70000)
        $isOtherIncome = \DB::table('m_charts_of_account')
            ->where('root_name', 70000)
            ->where('account_code', $rvMaster->account_code)
            ->exists();

        $debit = $rvMaster->amount_paid * $rvMaster->ex_rate;

        // Insert the Bank debit record
        General_ledger_v2::create([
            'account_code'     => $rvMaster->bank,
            'transaction_date' => $rvMaster->rv_date,
            'acc_table'       => 'rvoucher_master',
            'acc_table_id'    => $UniqueID1,
            'customer_id'     => $rvMaster->customer_id,
            'currency'        => $rvMaster->currency,
            'ex_rate'         => $rvMaster->ex_rate,
            'amount'          => $rvMaster->amount_paid,
            'ref_data'        => $rvMaster->rv_number,
            'debit'           => $debit,
            'credit'          => 0,
        ]);

        if (!$isOtherIncome) {

            if ($rvMaster->base_bank_charges > 0) {
                $UniqueID2 = $rvMaster->id . '-2';
                General_ledger_v2::create([
                    'account_code'     => $BNKCHRG,
                    'transaction_date' => $rvMaster->rv_date,
                    'acc_table'        => 'rvoucher_master',
                    'acc_table_id'     => $UniqueID2,
                    'customer_id'      => $rvMaster->customer_id,
                    'currency'         => $rvMaster->currency,
                    'ex_rate'          => $rvMaster->ex_rate,
                    'amount'           => $rvMaster->bank_charges,
                    'ref_data'         => $rvMaster->rv_number,
                    'debit'            => $rvMaster->base_bank_charges,
                    'credit'           => 0,
                ]);
            }

            if ($rvMaster->base_ex_rate_diff > 0) {
                $UniqueID3 = $rvMaster->id . '-3';
                General_ledger_v2::create([
                    'account_code'     => $EXDIFF,
                    'transaction_date' => $rvMaster->rv_date,
                    'acc_table'        => 'rvoucher_master',
                    'acc_table_id'     => $UniqueID3,
                    'customer_id'      => $rvMaster->customer_id,
                    'currency'         => $rvMaster->currency,
                    'ex_rate'          => $rvMaster->ex_rate,
                    'amount'           => $rvMaster->base_ex_rate_diff,
                    'ref_data'         => $rvMaster->rv_number,
                    'debit'            => $rvMaster->base_ex_rate_diff,
                    'credit'           => 0,
                ]);
            }

            if ($rvMaster->base_ex_rate_diff < 0) {
                $UniqueID3 = $rvMaster->id . '-3';
                $newBaseExRate = abs($rvMaster->base_ex_rate_diff);
                if ($newBaseExRate > 0) {
                    General_ledger_v2::create([
                        'account_code'     => $EXDIFF,
                        'transaction_date' => $rvMaster->rv_date,
                        'acc_table'        => 'rvoucher_master',
                        'acc_table_id'     => $UniqueID3,
                        'customer_id'      => $rvMaster->customer_id,
                        'currency'         => $rvMaster->currency,
                        'ex_rate'          => $rvMaster->ex_rate,
                        'amount'           => $newBaseExRate,
                        'ref_data'         => $rvMaster->rv_number,
                        'debit'            => 0,
                        'credit'           => $newBaseExRate,
                    ]);
                }
            }

            if ($rvMaster->excess_amount > 0) {
                $UniqueID4 = $rvMaster->id . '-4';
                // Credit record for excess payment
                General_ledger_v2::create([
                    'account_code'     => $CUSTEXCESSPAY,
                    'transaction_date' => $rvMaster->rv_date,
                    'acc_table'        => 'rvoucher_master',
                    'acc_table_id'     => $UniqueID4,
                    'customer_id'      => $rvMaster->customer_id,
                    'currency'         => $rvMaster->currency,
                    'ex_rate'          => $rvMaster->ex_rate,
                    'amount'           => $rvMaster->excess_amount,
                    'ref_data'         => $rvMaster->rv_number,
                    'debit'            => 0,
                    'credit'           => $rvMaster->base_excess_amount,
                ]);

                $UniqueID5 = $rvMaster->id . '-5';
                // Debit record for excess payment (Bank)
                General_ledger_v2::create([
                    'account_code'     => $rvMaster->bank,
                    'transaction_date' => $rvMaster->rv_date,
                    'acc_table'        => 'rvoucher_master',
                    'acc_table_id'     => $UniqueID5,
                    'customer_id'      => $rvMaster->customer_id,
                    'currency'         => $rvMaster->currency,
                    'ex_rate'          => $rvMaster->ex_rate,
                    'amount'           => $rvMaster->excess_amount,
                    'ref_data'         => $rvMaster->rv_number,
                    'debit'            => $rvMaster->base_excess_amount,
                    'credit'           => 0,
                ]);
            }
        }
    }
    public function handleRvMasterUpdate($newRvMaster){
        // Fetch required account codes once
        $settings = Accounting_settings::whereIn('chart_fix_code', [
            'BNKCHARGE', 'EXDIFF', 'CUSTEXCESSPAY', 'AR', 'AP', 'CRCUST'
        ])->pluck('account_code', 'chart_fix_code');

        $BNKCHRG = $settings->get('BNKCHARGE');
        $EXDIFF = $settings->get('EXDIFF');
        $CUSTEXCESSPAY = $settings->get('CUSTEXCESSPAY');
        $AR = $settings->get('AR');
        $AP = $settings->get('AP');
        $CRCUST = $settings->get('CRCUST');

        $UniqueID1 = $newRvMaster->id . '-1';
        $UniqueID2 = $newRvMaster->id . '-2';
        $UniqueID3 = $newRvMaster->id . '-3';
        $UniqueID4 = $newRvMaster->id . '-4';
        $UniqueID5 = $newRvMaster->id . '-5';

        // Check if Acc_Code (account_code) is under Other Income (root_name = 70000)
        $isOtherIncome = \DB::table('m_charts_of_account')
            ->where('root_name', 70000)
            ->where('account_code', $rvMaster->account_code)
            ->exists();

        $debit = $newRvMaster->amount_paid * $newRvMaster->ex_rate;

        // If status is 5, delete all GL entries related to this RVoucherNo
        if ($newRvMaster->rv_status_id == 5) {
            General_ledger_v2::where('ref_data', $newRvMaster->rv_number)->delete();
            return; // No need to update further if deleted
        }

        // Update Bank debit record (acc_table = 'rvoucher_detail' per trigger, double-check)
        General_ledger_v2::where('acc_table_id', $UniqueID1)
            ->where('acc_table', 'rvoucher_detail')
            ->update([
                'account_code' => $newRvMaster->bank,
                'transaction_date' => $newRvMaster->rv_date,
                'amount' => $newRvMaster->amount_paid,
                'debit' => $debit,
            ]);

        if (!$isOtherIncome) {

            if ($newRvMaster->base_bank_charges > 0) {
                General_ledger_v2::where('acc_table_id', $UniqueID2)
                    ->where('acc_table', 'rvoucher_detail')
                    ->update([
                        'account_code' => $BNKCHRG,
                        'transaction_date' => $newRvMaster->rv_date,
                        'amount' => $newRvMaster->bank_charges,
                        'debit' => $newRvMaster->base_bank_charges,
                    ]);
            }

            if ($newRvMaster->base_ex_rate_diff > 0) {
                General_ledger_v2::where('acc_table_id', $UniqueID3)
                    ->where('acc_table', 'rvoucher_detail')
                    ->update([
                        'account_code' => $EXDIFF,
                        'transaction_date' => $newRvMaster->rv_date,
                        'amount' => $newRvMaster->base_ex_rate_diff,
                        'debit' => $newRvMaster->base_ex_rate_diff,
                    ]);
            }

            if ($newRvMaster->base_ex_rate_diff < 0) {
                $newBaseExRate = abs($newRvMaster->base_ex_rate_diff);
                if ($newBaseExRate > 0) {
                    General_ledger_v2::where('acc_table_id', $UniqueID3)
                        ->where('acc_table', 'rvoucher_detail')
                        ->update([
                            'account_code' => $EXDIFF,
                            'transaction_date' => $newRvMaster->rv_date,
                            'amount' => $newBaseExRate,
                            'credit' => $newBaseExRate,
                        ]);
                }
            }

            if ($newRvMaster->excess_amount > 0) {
                General_ledger_v2::where('acc_table_id', $UniqueID4)
                    ->where('acc_table', 'rvoucher_detail')
                    ->update([
                        'account_code' => $CUSTEXCESSPAY,
                        'transaction_date' => $newRvMaster->rv_date,
                        'amount' => $newRvMaster->excess_amount,
                        'debit' => $newRvMaster->base_excess_amount,
                    ]);

                General_ledger_v2::where('acc_table_id', $UniqueID5)
                    ->where('acc_table', 'rvoucher_detail')
                    ->update([
                        'account_code' => $newRvMaster->bank,
                        'transaction_date' => $newRvMaster->rv_date,
                        'amount' => $newRvMaster->excess_amount,
                        'debit' => $newRvMaster->base_excess_amount,
                    ]);
            }
        }
    }
}
