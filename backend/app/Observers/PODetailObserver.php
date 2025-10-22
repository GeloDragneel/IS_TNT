<?php

namespace App\Observers;

use App\Models\POrder_master;
use App\Models\POrder_detail;
use App\Models\General_ledger_v2;

class PODetailObserver
{
    /**
     * Handle the POrder_detail "created" event.
    */
    public function created(POrder_detail $pOrder_detail): void{
        // Ensure data exists
        $poDate = POrder_master::where('po_number', $newPODetail->po_number)->value('po_date');
        $arMasterID = $newPODetail->id;

        $uniqueID1 = $arMasterID . '-1';
        $uniqueID2 = $arMasterID . '-2';

        if ($newPODetail->qty == $newPODetail->receive_qty && is_null($newPODetail->invoice_pv)) {
            // Debit entry (12300)
            General_ledger_v2::create([
                'account_code'     => 12300,
                'transaction_date' => $poDate,
                'acc_table'        => 'porder_detail',
                'currency'         => $newPODetail->currency,
                'ex_rate'          => $newPODetail->ex_rate,
                'amount'           => $newPODetail->total,
                'debit'            => $newPODetail->base_total,
                'credit'           => 0,
                'acc_table_id'     => $uniqueID2,
                'supplier_id'      => $newPODetail->supplier_id,
                'customer_id'      => null,
                'ref_data'         => $newPODetail->po_number,
            ]);

            // Credit entry (21100)
            General_ledger_v2::create([
                'account_code'     => 21100,
                'transaction_date' => $poDate,
                'acc_table'        => 'porder_detail',
                'currency'         => $newPODetail->currency,
                'ex_rate'          => $newPODetail->ex_rate,
                'amount'           => $newPODetail->total,
                'debit'            => 0,
                'credit'           => $newPODetail->base_total,
                'acc_table_id'     => $uniqueID1,
                'supplier_id'      => $newPODetail->supplier_id,
                'customer_id'      => null,
                'ref_data'         => $newPODetail->po_number,
            ]);
        } else {
            // Delete any existing GL entries for this PO detail
            General_ledger_v2::where('acc_table', 'porder_detail')
                ->whereIn('acc_table_id', [$uniqueID1, $uniqueID2])
                ->where('ref_data', $newPODetail->po_number)
                ->delete();
        }
    }

    /**
     * Handle the POrder_detail "updated" event.
    */
    public function updated(POrder_detail $updatedPODetail): void{
        $poDate = POrder_master::where('po_number', $updatedPODetail->po_number)->value('po_date');
        $arMasterID = $updatedPODetail->id;
        $uniqueID1 = $arMasterID . '-1';
        $uniqueID2 = $arMasterID . '-2';

        if (
            $updatedPODetail->qty == $updatedPODetail->receive_qty &&
            is_null($updatedPODetail->InvoicePV)
        ) {
            // Update or create Debit Entry (12300)
            General_ledger_v2::updateOrCreate(
                [
                    'acc_table'     => 'porder_detail',
                    'acc_table_id'  => $uniqueID2,
                    'ref_data'      => $updatedPODetail->po_number,
                ],
                [
                    'account_code'     => 12300,
                    'transaction_date' => $poDate,
                    'currency'         => $updatedPODetail->currency,
                    'ex_rate'          => $updatedPODetail->ex_rate,
                    'amount'           => $updatedPODetail->total,
                    'debit'            => $updatedPODetail->base_total,
                    'credit'           => 0,
                    'supplier_id'      => $updatedPODetail->supplier_id,
                    'customer_id'      => null,
                ]
            );

            // Update or create Credit Entry (21100)
            General_ledger_v2::updateOrCreate(
                [
                    'acc_table'     => 'porder_detail',
                    'acc_table_id'  => $uniqueID1,
                    'ref_data'      => $updatedPODetail->po_number,
                ],
                [
                    'account_code'     => 21100,
                    'transaction_date' => $poDate,
                    'currency'         => $updatedPODetail->currency,
                    'ex_rate'          => $updatedPODetail->ex_rate,
                    'amount'           => $updatedPODetail->total,
                    'debit'            => 0,
                    'credit'           => $updatedPODetail->base_total,
                    'supplier_id'      => $updatedPODetail->supplier_id,
                    'customer_id'      => null,
                ]
            );
        } else {
            // If not fully received or InvoicePV is not null, delete both entries
            General_ledger_v2::where('acc_table', 'porder_detail')
                ->whereIn('acc_table_id', [$uniqueID1, $uniqueID2])
                ->where('ref_data', $updatedPODetail->po_number)
                ->delete();
        }
    }

    /**
     * Handle the POrder_detail "deleted" event.
     */
    public function deleted(POrder_detail $pOrder_detail): void
    {
        //
    }

    /**
     * Handle the POrder_detail "restored" event.
     */
    public function restored(POrder_detail $pOrder_detail): void
    {
        //
    }

    /**
     * Handle the POrder_detail "force deleted" event.
     */
    public function forceDeleted(POrder_detail $pOrder_detail): void
    {
        //
    }
}
