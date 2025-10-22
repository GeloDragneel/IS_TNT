<?php

namespace App\Services;

use Carbon\Carbon;
use App\Models\Products;
use App\Models\POrder_detail;
use App\Models\Orders;
use App\Models\Grn_details;
use App\Models\Inventory_tblmaster;

class ProductStatusService
{
    public function getProductStatus($id)
    {
        $today = Carbon::now();
        $status = 'No Order';

        $product = Products::where('id', $id)->first();

        if (!$product) {
            return 'No Order';
        }

        $productId = $product->id;
        $preorderStart = $product->preorder_start_date;
        $preorderEnd = $product->preorder_end_date;

        if ($preorderStart && $preorderEnd && $today->between($preorderStart, $preorderEnd)) {
            return 'Pre-order';
        }

        $hasPO = POrder_detail::where('product_id', $productId)->exists();
        $hasOrder = Orders::where('product_id', $productId)->exists();
        $hasGRN = Grn_details::where('product_id', $productId)->exists();

        if (!$hasPO && !$hasOrder && !$hasGRN && $preorderEnd && $today->greaterThanOrEqualTo($preorderEnd)) {
            return 'No Order';
        }

        $hasPendingPO = POrder_detail::where('product_id', $productId)
            ->where('qty', '>', 0)
            ->whereColumn('qty', '>', 'receive_qty')
            ->where('receive_qty', '=', 0)
            ->exists();

        $hasPendingGRN = Grn_details::where('product_id', $productId)
            ->where('grn_status_id', 1)
            ->exists();

        if (
            (!$hasGRN || $hasPendingPO || $hasPendingGRN) &&
            $preorderEnd && $today->greaterThanOrEqualTo($preorderEnd)
        ) {
            return 'Coming Soon';
        }

        $latestPO = POrder_detail::where('product_id', $productId)->orderByDesc('id')->first();

        if (
            (!$hasGRN ||
                ($latestPO && $latestPO->qty > $latestPO->receive_qty && $latestPO->receive_qty > 0) ||
                Grn_details::where('product_id', $productId)->where('grn_status_id', 1)->exists()
            ) &&
            $preorderEnd && $today->greaterThanOrEqualTo($preorderEnd)
        ) {
            return 'Partial Received';
        }

        $stockQty = Inventory_tblmaster::where('product_id', $productId)
            ->selectRaw('COALESCE(SUM(qty - allocated_qty), 0) as stock_qty')
            ->value('stock_qty');

        $holdQty = max($product->hold_qty ?? 0, 0);

        if ($hasGRN && ($stockQty - $holdQty) > 0) {
            return 'In-Stock';
        }

        if (
            $holdQty > 0 &&
            $hasGRN &&
            $stockQty == $holdQty
        ) {
            return 'On Hold';
        }

        if ($hasGRN && ($stockQty - $holdQty) <= 0) {
            return 'Sold Out';
        }

        return $status;
    }
}
