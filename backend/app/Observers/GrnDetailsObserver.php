<?php

namespace App\Observers;

use App\Models\Grn_details;
use App\Models\Products;
use App\Models\Orders;
use App\Models\POrder_master;
use App\Models\POrder_detail;
use App\Models\Grn_accounts_payable;
use App\Models\General_ledger;
use App\Models\Inventory_tblmaster;
use App\Models\Inventory_allocation;
use App\Models\Accounts_payable_master;
use App\Models\Accounts_payable_details;
use App\Models\Accounting_settings;
use App\Services\ProductStatusService;

class GrnDetailsObserver
{
    /**
     * Handle the Grn_details "created" event.
    */
    public function created(Grn_details $grn_details): void{
        $this->updateInventory($grn_details);
        $this->getUpdateProductStatus($grn_details->product_id);
    }

    /**
     * Handle the Grn_details "updated" event.
    */
    public function updated(Grn_details $grn_details): void{
        // Call the updateInventory method
        $this->updateInventory($grn_details);
        $this->getUpdateProductStatus($grn_details->product_id);
    }

    /**
     * Handle the Grn_details "deleted" event.
    */
    public function deleted(Grn_details $grn_details): void{

        $grnDetailId = $grn_details->id;
        $productId = $grn_details->product_id;
        $grnNo = $grn_details->grn_no;
        $oldWarehouse = $grn_details->warehouse;
        $oldProductId = $grn_details->product_id;

        if($grn_details->imported === 0){
            // Step 1: Update POrder_detail's ReceiveQty
            $pOrderDetail = POrder_detail::find($poid);
            if ($pOrderDetail) {
                $pOrderDetail->receive_qty -= $oldQty;
                $pOrderDetail->save();
            }

            // Step 2: Calculate total quantities and received quantities for the PO
            $poNumber = $pOrderDetail->po_number;
            $totalPoQty = POrder_detail::where('po_number', $poNumber)->sum('qty');
            $totalPoReceiveQty = POrder_detail::where('po_number', $poNumber)->sum('receive_qty');
            $poBalanceQty = $totalPoQty - $totalPoReceiveQty;

            // Step 3: Update PO status based on balance and received qty
            if ($poBalanceQty == 0) {
                // Fully received
                POrder_master::where('po_number', $poNumber)->update(['postatus_id' => 3]);
                POrder_detail::where('po_number', $poNumber)->update(['postatus_id' => 3]);
            }

            if ($poBalanceQty > 0) {
                // Partially received
                POrder_master::where('po_number', $poNumber)->update(['postatus_id' => 2]);
                POrder_detail::where('po_number', $poNumber)->update(['postatus_id' => 2]);
            }

            if ($totalPoReceiveQty == 0) {
                // Not received
                POrder_master::where('po_number', $poNumber)->update(['postatus_id' => 1]);
                POrder_detail::where('po_number', $poNumber)->update(['postatus_id' => 1]);
            }

            // Step 4: Update GRNNo in grn_accountspayable
            Grn_accounts_payable::where('po_detail_id', $poid)->update(['grn_no' => '']);
        }

        // Step 1: Calculate the sum of quantities for the specific Warehouse and ItemCode
        $sumQty = Grn_detail::where('warehouse', $oldWarehouse)->where('product_id', $oldProductId)->sum('qty');  // Sum of 'qty' for the given warehouse and item code
        // Step 2: Update the `Qty` field in `inventory_tblmaster` for the specific Warehouse and ItemCode
        Inventory_tblmaster::where('warehouse', $oldWarehouse)->where('product_id', $oldProductId)->update(['qty' => $sumQty]);  // Update the quantity with the sum
        // Step 3: Delete records from `inventory_tblmaster` where `qty` is zero
        Inventory_tblmaster::where('qty', 0)->delete();  // Delete records with qty = 0
        // Step 4: Delete records from `inventory_allocation` where `GRNID` matches the old ID
        Inventory_allocation::where('grn_detail_id', $grnDetailId)->delete();  // Delete the allocation records for the specific GRN

        // UNDO GRN
        $accounts = Accounting_settings::whereIn('chart_fix_code', ['AP'])->pluck('account_code', 'chart_fix_code');
        $AP = $accounts['AP'] ?? null;

        General_ledger::where('ref_data', $grnNo)->delete(); 
        Grn_accounts_payable::where('grn_no', $grnNo)->where('account_code',$AP)->delete(); 
        Grn_accounts_payable::where('grn_no', $grnNo)->update(['grn_no' => '']);

        $this->getUpdateProductStatus($productId);
    }

    /**
     * Handle the Grn_details "restored" event.
    */
    public function restored(Grn_details $grn_details): void{
        //
    }

    /**
     * Handle the Grn_details "force deleted" event.
    */
    public function forceDeleted(Grn_details $grn_details): void{
        //
    }
 
    function updateInventory(Grn_details $grnDetail): void{
        $grnNo = $grnDetail->grn_no;
        $grnDate = $grnDetail->grn_date;
        $itemCode = $grnDetail->product_id;  // changed from itemCode to product_id
        $warehouse = $grnDetail->warehouse;
        $poId = $grnDetail->po_id;
        $imported = $grnDetail->imported;
        $qty = $grnDetail->qty;

        $grnStatus = $grnDetail->grn_status_id;
        // Update PO Detail
        POrder_detail::where('id', $poId)->update(['receive_date' => $grnDate]);

        // Process imported details
        if ($imported == 0) {
            POrder_detail::where('id', $poId)->update(['receive_qty' => $qty]);

            $poNumber = POrder_detail::where('id', $poId)->value('po_number');
            $totalPOQty = POrder_detail::where('po_number', $poNumber)->sum('qty');
            $totalPOReceiveQty = POrder_detail::where('po_number', $poNumber)->sum('receive_qty');
            $poBalanceQty = $totalPOQty - $totalPOReceiveQty;

            // Update PO status based on balance quantity
            if ($poBalanceQty == 0) {
                POrder_master::where('po_number', $poNumber)->update(['postatus_id' => 3]);
                POrder_detail::where('po_number', $poNumber)->update(['postatus_id' => 3]);
            } elseif ($poBalanceQty > 0) {
                POrder_master::where('po_number', $poNumber)->update(['postatus_id' => 2]);
                POrder_detail::where('po_number', $poNumber)->update(['postatus_id' => 2]);
            } elseif ($totalPOReceiveQty == 0) {
                POrder_master::where('po_number', $poNumber)->update(['postatus_id' => 1]);
                POrder_detail::where('po_number', $poNumber)->update(['postatus_id' => 1]);
            }
            if ($grnStatus == 2) {
                // Update Accounts payable
                Grn_accounts_payable::where('po_detail_id', $poId)->update(['grn_no' => $grnNo]);
            }
        }
        // Process GRN status 2
        if ($grnStatus == 2) {
            // Update the product's last received date
            Products::where('id', $itemCode)->update(['last_received_date' => $grnDate]);

            // Update AP invoice details
            Accounts_payable_details::where('po_detail_id', $poId)->increment('receive_qty', $qty);

            // Inventory Update
            $nItemCodeWH = Inventory_tblmaster::where('warehouse', $warehouse)
                ->where('product_id', $itemCode)
                ->count();

            $sumQty = Grn_details::where('warehouse', $warehouse)
                ->where('product_id', $itemCode)
                ->sum('qty');

            $sumInternalTransferQty = Inventory_tblmaster::where('product_id', $itemCode)
                ->where('from_grn', 0)  // Assuming 0 means internal transfer
                ->sum('qty');

            $newReceiveQty = $sumQty - $sumInternalTransferQty;

            if ($nItemCodeWH == 0) {
                // Insert new inventory record if it doesn't exist
                Inventory_tblmaster::create([
                    'product_id' => $itemCode,
                    'qty' => $newReceiveQty,
                    'warehouse' => $warehouse,
                    'allocated_qty' => 0,
                    'from_grn' => 1, // Assuming 1 means from GRN
                ]);
            } else {
                // Update existing inventory record
                Inventory_tblmaster::where('warehouse', $warehouse)
                    ->where('product_id', $itemCode)
                    ->where('from_grn', 1)
                    ->update(['qty' => $newReceiveQty]);
            }
            // Delete inventory records with 0 quantity
            Inventory_tblmaster::where('qty', 0)->delete();
        }
    }
    public function getUpdateProductStatus($productId){
        $ProductStatusService = new ProductStatusService;
        $ProductStatus = $ProductStatusService->getProductStatus($productId);

        Products::where('id', $productId)->update([
            'product_status' => $ProductStatus,
        ]);

        $this->getUpdateProductRemQty($productId);
    }
    public function getUpdateProductRemQty($productId){
        $orderQty = Orders::where('product_id', $productId)->sum('qty');
        $poQty = POrder_detail::where('product_id', $productId)
            ->whereIn('postatus_id', [1, 2])
            ->sum('qty');

        $remPOQty = POrder_detail::where('product_id', $productId)
            ->whereIn('postatus_id', [1, 2])
            ->selectRaw('COALESCE(SUM(qty - receive_qty), 0) AS qty')
            ->value('qty');

        $product_status = Products::where('id', $productId)
            ->value('product_status');

        switch($product_status){
            case 'Pre-order': 
                Products::where('id', $productId)->update([
                    'rem_qty' => $orderQty,
                    'is_po_qty' => 0
                ]);
            break;
            case 'Coming Soon': 
                
                if((int) $poQty > 0){
                    Products::where('id', $productId)->update([
                        'rem_qty' => $poQty,
                        'is_po_qty' => 1
                    ]);
                }
                else{
                    Products::where('id', $productId)->update([
                        'rem_qty' => $orderQty,
                        'is_po_qty' => 0
                    ]);
                }
                
            break;
            case 'Partial Received':
                Products::where('id', $productId)->update([
                    'rem_qty' => $remPOQty,
                    'is_po_qty' => 0
                ]);
            break;
            case 'No Order': 
                Products::where('id', $productId)->update([
                    'rem_qty' => $poQty,
                    'is_po_qty' => 0
                ]);
            break;
            case 'Sold Out': 
                Products::where('id', $productId)->update([
                    'rem_qty' => 0,
                    'is_po_qty' => 0
                ]);
            break;
        }

    }
}
