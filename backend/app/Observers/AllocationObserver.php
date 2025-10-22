<?php

namespace App\Observers;

use App\Models\Inventory_allocation;
use App\Models\Inventory_tblmaster;
use App\Models\Orders;
use App\Models\POrder_detail;
use App\Models\Accounting_settings;
use App\Models\Grn_details;
use App\Models\General_ledger;

class AllocationObserver
{
    /**
     * Handle the Inventory_allocation "created" event.
    */
    public function created(Inventory_allocation $alloc): void{
        $this->triggerOnGlobal($alloc);
    }

    /**
     * Handle the Inventory_allocation "updated" event.
    */
    public function updated(Inventory_allocation $alloc): void{
        $this->triggerOnGlobal($alloc);
    }
    /**
     * Handle the Inventory_allocation "deleted" event.
    */
    public function triggerOnGlobal(Inventory_allocation $alloc){
        $restore_order = $alloc->restore_order;
        if($restore_order === 1){
            Orders::where('id', $alloc->order_id)->update(['allocated_qty' => 0, 'show_category' => 'orders']);
        }
        else{
            $sum_allocation = Inventory_allocation::where('grn_detail_id',$alloc->grn_detail_id)->sum('qty');
            $sum_order_allocation = Inventory_allocation::where('order_id',$alloc->order_id)->sum('qty');
            $sum_allocation_on_po = Inventory_allocation::where('po_detail_id',$alloc->po_detail_id)->sum('qty');
            $order_qty = Orders::where('id',$alloc->order_id)->sum('qty');
            $sum_qty = Inventory_allocation::where('warehouse',$alloc->warehouse)->where('product_id',$alloc->product_id)->sum('qty');

            Grn_details::where('id', $alloc->grn_detail_id)
                ->update(['allocation' => $sum_allocation]);

            Orders::where('id', $alloc->order_id)
                ->update(['allocated_qty' => $sum_order_allocation]);

            Inventory_tblmaster::where('warehouse',$alloc->warehouse)
                ->where('product_id',$alloc->product_id)
                ->update(['allocated_qty' => $sum_qty]);

            if($order_qty === $sum_order_allocation){
                Orders::where('id', $alloc->order_id)
                    ->update(['show_category' => 'history']);
            }

            POrder_detail::where('id', $alloc->po_detail_id)
                ->update(['allocated_qty' => $sum_allocation_on_po, 'is_allocated' => 1]);
        
            if (!empty($alloc->account_no) && strlen($alloc->account_no) > 3) {

                $accounts = Accounting_settings::whereIn('chart_fix_code', [
                    'INV'
                ])->pluck('account_code', 'chart_fix_code');

                $INV = $accounts['INV'] ?? null;
                
                $now = now(); // Laravel helper (Carbon instance)
                $curDate = $now->format('ymd') . '-' . $now->format('His');
                $JVNo = 'JV' . $curDate;

                $UniqueID1 = $alloc->id . '-1';
                $generalLedger = General_ledger::where('acc_table_id', $UniqueID1)
                    ->where('acc_table','inventory_allocation')->first();

                if(!$generalLedger){
                    General_ledger::create([
                        'account_code'      => $INV,
                        'transaction_date'  => date('M d Y'),
                        'acc_table'         => "inventory_allocation",
                        'currency'          => $alloc->currency,
                        'ex_rate'           => 1,
                        'acc_table_id'      => $UniqueID1,
                        'supplier_id'       => NULL,
                        'ref_data'          => "Inventory Withdrawal",
                        'amount'            => $alloc->total,
                        'debit'             => 0,
                        'credit'            => $alloc->total,
                    ]);
                }
                else{
                    $generalLedger->account_code = $INV;
                    $generalLedger->transaction_date = date('M d Y');
                    $generalLedger->acc_table = "inventory_allocation";
                    $generalLedger->currency = $alloc->currency;
                    $generalLedger->ex_rate = 1;
                    $generalLedger->acc_table_id = $UniqueID1;
                    $generalLedger->supplier_id = NULL;
                    $generalLedger->ref_data = "Inventory Withdrawal";
                    $generalLedger->amount = $alloc->total;
                    $generalLedger->debit = 0;
                    $generalLedger->credit = $alloc->total;
                    $generalLedger->save();
                }

                $UniqueID2 = $alloc->id . '-2';
                $generalLedger = General_ledger::where('acc_table_id', $UniqueID2)
                    ->where('acc_table','inventory_allocation')->first();

                if(!$generalLedger){
                    General_ledger::create([
                        'account_code'      => $alloc->account_no,
                        'transaction_date'  => date('M d Y'),
                        'acc_table'         => "inventory_allocation",
                        'currency'          => $alloc->currency,
                        'ex_rate'           => 1,
                        'acc_table_id'      => $UniqueID1,
                        'supplier_id'       => NULL,
                        'ref_data'          => "Inventory Withdrawal",
                        'amount'            => $alloc->total,
                        'debit'             => $alloc->total,
                        'credit'            => 0,
                    ]);
                }
                else{
                    $generalLedger->account_code = $alloc->account_no;
                    $generalLedger->transaction_date = date('M d Y');
                    $generalLedger->acc_table = "inventory_allocation";
                    $generalLedger->currency = $alloc->currency;
                    $generalLedger->ex_rate = 1;
                    $generalLedger->acc_table_id = $UniqueID1;
                    $generalLedger->supplier_id = NULL;
                    $generalLedger->ref_data = "Inventory Withdrawal";
                    $generalLedger->amount = $alloc->total;
                    $generalLedger->debit = $alloc->total;
                    $generalLedger->credit = 0;
                    $generalLedger->save();
                }

            }
        }
    }
    public function deleted(Inventory_allocation $alloc): void{
        $sum_allocation = Inventory_allocation::where('grn_detail_id',$alloc->grn_detail_id)->sum('qty');
        $sum_order_allocation = Inventory_allocation::where('order_id',$alloc->order_id)->sum('qty');
        $sum_allocation_on_po = Inventory_allocation::where('po_detail_id',$alloc->po_detail_id)->sum('qty');
        $order_qty = Orders::where('id',$alloc->order_id)->sum('qty');
        $sum_qty = Inventory_allocation::where('warehouse',$alloc->warehouse)->where('product_id',$alloc->product_id)->sum('qty');

        Grn_details::where('id', $alloc->grn_detail_id)
            ->update(['allocation' => $sum_allocation]);

        Orders::where('id', $alloc->order_id)
            ->update(['allocated_qty' => $sum_order_allocation]);

        Inventory_tblmaster::where('warehouse',$alloc->warehouse)
            ->where('product_id',$alloc->product_id)
            ->update(['allocated_qty' => $sum_qty]);

        $UniqueID1 = $alloc->id . '-1';
        $UniqueID2 = $alloc->id . '-2';

        General_ledger::where('acc_table_id', $UniqueID1)->where('acc_table','inventory_allocation')->delete();
        General_ledger::where('acc_table_id', $UniqueID2)->where('acc_table','inventory_allocation')->delete();
    }

    /**
     * Handle the Inventory_allocation "restored" event.
    */
    public function restored(Inventory_allocation $alloc): void{
        //
    }

    /**
     * Handle the Inventory_allocation "force deleted" event.
    */
    public function forceDeleted(Inventory_allocation $alloc): void{
        //
    }
}
