<?php

namespace App\Observers;

use App\Models\Sales_order_detail;
use App\Models\Invoice_detail;
use App\Models\Customer_deposit;
use App\Models\Inventory_allocation;
use Illuminate\Support\Facades\Log;

class SODetailObserver
{
    // Property to temporarily store old data during deleting
    protected $oldData = [];

    /**
     * Handle the Sales_order_detail "deleting" event.
     * This happens BEFORE the record is deleted.
    */
    public function deleting(Sales_order_detail $salesOrderDetail): void{
        $orderId = $salesOrderDetail->order_id ?? null;
        $allocationId = $salesOrderDetail->allocated_id ?? null;

        // 1. Update Customer Deposit
        if ($orderId) {
            $sumDeposit = Invoice_detail::where('order_id', $orderId)->sum('deposit');
            Customer_deposit::where('order_id', $orderId)->update([
                'invoice_no' => null,
                'used_deposit' => $sumDeposit,
            ]);
        }
        // 2. Delete Inventory Allocation
        if ($allocationId) {
            $allocation = Inventory_allocation::find($allocationId);
            if ($allocation) {
                $allocation->delete(); // ✅ Triggers observer
            }
        }
    }
    /**
     * Handle the Sales_order_detail "deleted" event.
     * This happens AFTER the record is deleted.
    */
    public function created(Sales_order_detail $salesOrderDetail): void {}
    public function updated(Sales_order_detail $salesOrderDetail): void {}
    public function restored(Sales_order_detail $salesOrderDetail): void {}
    public function forceDeleted(Sales_order_detail $salesOrderDetail): void {}
}
