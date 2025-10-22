<?php

namespace App\Observers;

use App\Models\Grn_master;
use App\Models\Accounting_settings;
use App\Models\General_ledger;
use App\Models\Grn_accounts_payable;

class GrnMasterObserver
{
    /**
     * Handle the Grn_master "created" event.
     */
    public function created(Grn_master $grn_master): void{
        $this->triggerOnMaster($grn_master);
    }
    /**
     * Handle the Grn_master "updated" event.
     */
    public function updated(Grn_master $grn_master): void{

        if($grn_master->grn_status_id === 3){
            $uniqueIds = [
                $grn_master->id . '-1',
                $grn_master->id . '-2',
            ];
            $accountCodes = Accounting_settings::whereIn('chart_fix_code', ['AP'])->pluck('account_code', 'chart_fix_code');
            $AP = $accountCodes['AP'];

            General_ledger::whereIn('acc_table_id', $uniqueIds)->where('acc_table','grn_master')->where('account_code',$AP)->delete();
            Grn_accounts_payable::where('grn_no',$grn_master->grn_no)-delete();
        }
        else{
            $this->triggerOnMaster($grn_master);
        }
    }

    /**
     * Handle the Grn_master "deleted" event.
     */
    public function deleted(Grn_master $grn_master): void
    {
        //
    }

    /**
     * Handle the Grn_master "restored" event.
     */
    public function restored(Grn_master $grn_master): void
    {
        //
    }

    /**
     * Handle the Grn_master "force deleted" event.
     */
    public function forceDeleted(Grn_master $grn_master): void
    {
        //
    }


    public function triggerOnMaster(Grn_master $grn_master): void{
        $accountCodes = Accounting_settings::whereIn('chart_fix_code', [
            'AP', 'INV', 'CAPITAL'
        ])->pluck('account_code', 'chart_fix_code');

        $AP = $accountCodes['AP'];
        $INV = $accountCodes['INV'];
        $CAPITAL = $accountCodes['CAPITAL'];

        if($grn_master->imported === 0){

            if($grn_master->grn_status_id === 2){

                $UniqueID1 = $grn_master->id . '-1';
                $UniqueID2 = $grn_master->id . '-2';

                $generalLedger = General_ledger::where('acc_table_id', $UniqueID1)->where('acc_table','grn_master')->first();
                if(!$generalLedger){
                    General_ledger::create([
                        'account_code'      => $INV,
                        'transaction_date'  => $grn_master->grn_date,
                        'acc_table'         => 'grn_master',
                        'currency'          => $grn_master->currency,
                        'ex_rate'           => $grn_master->ex_rate,
                        'acc_table_id'      => $UniqueID1,
                        'supplier_id'       => $grn_master->supplier_id,
                        'ref_data'          => $grn_master->grn_no,
                        'amount'            => $grn_master->total,
                        'debit'             => $grn_master->base_total,
                        'credit'            => 0,
                    ]);
                }
                else{
                    $generalLedger->account_code = $INV;
                    $generalLedger->transaction_date = $grn_master->grn_date;
                    $generalLedger->acc_table = 'grn_master';
                    $generalLedger->currency = $grn_master->currency;
                    $generalLedger->ex_rate = $grn_master->ex_rate;
                    $generalLedger->acc_table_id = $UniqueID1;
                    $generalLedger->supplier_id = $grn_master->supplier_id;
                    $generalLedger->ref_data = $grn_master->grn_no;
                    $generalLedger->amount = $grn_master->total;
                    $generalLedger->debit = $grn_master->base_total;
                    $generalLedger->credit = 0;
                    $generalLedger->save();
                }

                $generalLedger = General_ledger::where('acc_table_id', $UniqueID2)->where('acc_table','grn_master')->first();
                if(!$generalLedger){
                    General_ledger::create([
                        'account_code'      => $AP,
                        'transaction_date'  => $grn_master->grn_date,
                        'acc_table'         => 'grn_master',
                        'currency'          => $grn_master->currency,
                        'ex_rate'           => $grn_master->ex_rate,
                        'acc_table_id'      => $UniqueID2,
                        'supplier_id'       => $grn_master->supplier_id,
                        'ref_data'          => $grn_master->grn_no,
                        'amount'            => $grn_master->total,
                        'debit'             => 0,
                        'credit'            => $grn_master->base_total,
                    ]);
                }
                else{
                    $generalLedger->account_code = $AP;
                    $generalLedger->transaction_date = $grn_master->grn_date;
                    $generalLedger->acc_table = 'grn_master';
                    $generalLedger->currency = $grn_master->currency;
                    $generalLedger->ex_rate = $grn_master->ex_rate;
                    $generalLedger->acc_table_id = $UniqueID2;
                    $generalLedger->supplier_id = $grn_master->supplier_id;
                    $generalLedger->ref_data = $grn_master->grn_no;
                    $generalLedger->amount = $grn_master->total;
                    $generalLedger->debit = 0;
                    $generalLedger->credit = $grn_master->base_total;
                    $generalLedger->save();
                }

                $grnAccountsPayable = Grn_accounts_payable::where('grn_no', $grn_master->grn_no)->where('account_code',$AP)->first();
                $count_grnAccountsPayable = $grnAccountsPayable->count();

                $balance = GrnAccountPayable::where('grn_no', $grn_master->grn_no)->sum('credit') - GrnAccountPayable::where('grn_no', $grn_master->grn_no)->sum('debit');

                if($count_grnAccountsPayable === 0){

                    Grn_accounts_payable::create([
                        'grn_no'                => $grn_master->grn_no,
                        'transaction_date'      => $grn_master->grn_date,
                        'account_code'          => $AP,
                        'account_description'   => "Accounts Payable 应付账单",
                        'product_id'            => NULL,
                        'supplier_id'           => $grn_master->supplier_id,
                        'pv_detail_id'          => NULL,
                        'po_detail_id'          => NULL,
                        'currency'              => $grn_master->currency,
                        'amount'                => $grn_master->total,
                        'base_amount'           => $grn_master->base_total,
                        'debit'                 => 0,
                        'credit'                => $grn_master->base_total,
                        'balance'               => $balance,
                    ]);
                }
                else{
                    $grnAccountsPayable->grn_no = $AP;
                    $grnAccountsPayable->transaction_date = $grn_master->grn_date;
                    $grnAccountsPayable->account_code = $AP;
                    $grnAccountsPayable->account_description = "Accounts Payable 应付账单";
                    $grnAccountsPayable->supplier_id = $grn_master->supplier_id;
                    $grnAccountsPayable->amount = $grn_master->total;
                    $grnAccountsPayable->debit = 0;
                    $grnAccountsPayable->credit = $grn_master->base_total;
                    $grnAccountsPayable->balance = $balance;
                    $generalLedger->save();
                }

            }
        }
        else{
            $UniqueID1 = $grn_master->id . '-1';
            $UniqueID2 = $grn_master->id . '-2';
            $generalLedger = General_ledger::where('acc_table_id', $UniqueID1)->where('acc_table','grn_master')->first();
            if(!$generalLedger){
                General_ledger::create([
                    'account_code'      => $INV,
                    'transaction_date'  => $grn_master->grn_date,
                    'acc_table'         => 'grn_master',
                    'currency'          => $grn_master->currency,
                    'ex_rate'           => $grn_master->ex_rate,
                    'acc_table_id'      => $UniqueID1,
                    'supplier_id'       => $grn_master->supplier_id,
                    'ref_data'          => $grn_master->grn_no,
                    'amount'            => $grn_master->total,
                    'debit'             => $grn_master->base_total,
                    'credit'            => 0,
                ]);
            }
            else{
                $generalLedger->account_code = $INV;
                $generalLedger->transaction_date = $grn_master->grn_date;
                $generalLedger->acc_table = 'grn_master';
                $generalLedger->currency = $grn_master->currency;
                $generalLedger->ex_rate = $grn_master->ex_rate;
                $generalLedger->acc_table_id = $UniqueID1;
                $generalLedger->supplier_id = $grn_master->supplier_id;
                $generalLedger->ref_data = $grn_master->grn_no;
                $generalLedger->amount = $grn_master->total;
                $generalLedger->debit = $grn_master->base_total;
                $generalLedger->credit = 0;
                $generalLedger->save();
            }

            $generalLedger = General_ledger::where('acc_table_id', $UniqueID2)->where('acc_table','grn_master')->first();
            if(!$generalLedger){
                General_ledger::create([
                    'account_code'      => $AP,
                    'transaction_date'  => $grn_master->grn_date,
                    'acc_table'         => 'grn_master',
                    'currency'          => $grn_master->currency,
                    'ex_rate'           => $grn_master->ex_rate,
                    'acc_table_id'      => $UniqueID2,
                    'supplier_id'       => $grn_master->supplier_id,
                    'ref_data'          => $grn_master->grn_no,
                    'amount'            => $grn_master->total,
                    'debit'             => 0,
                    'credit'            => $grn_master->base_total,
                ]);
            }
            else{
                $generalLedger->account_code = $AP;
                $generalLedger->transaction_date = $grn_master->grn_date;
                $generalLedger->acc_table = 'grn_master';
                $generalLedger->currency = $grn_master->currency;
                $generalLedger->ex_rate = $grn_master->ex_rate;
                $generalLedger->acc_table_id = $UniqueID2;
                $generalLedger->supplier_id = $grn_master->supplier_id;
                $generalLedger->ref_data = $grn_master->grn_no;
                $generalLedger->amount = $grn_master->total;
                $generalLedger->debit = 0;
                $generalLedger->credit = $grn_master->base_total;
                $generalLedger->save();
            }
        }
    }

}
