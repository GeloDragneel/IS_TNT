<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\DB;
use App\Models\Inventory_tblmaster;
use App\Models\Price_setup;
use App\Models\Grn_details;
use App\Models\Inventory_allocation;
use App\Models\Products;

use App\Events\ProductEvent;
use App\Events\AllocationEvent;
use App\Events\InventoryEvent;

use Carbon\Carbon;
use Illuminate\Http\Request;

class InventoryController extends Controller{
    
    public function getInventoryList(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');
        $currentPage = max(1, (int) $request->input('page', 1));

        // Get all inventory records with related product and warehouse
        $query = Inventory_tblmaster::with(['product', 'whList'])->orderByDesc('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('warehouse', 'like', "%{$search}%")
                    ->orWhereHas('product', function ($q) use ($search) {
                        $q->where('product_code', 'like', "%{$search}%")
                            ->orWhere('product_title_en', 'like', "%{$search}%")
                            ->orWhere('product_title_cn', 'like', "%{$search}%");
                    });
            });
        }

        // Fetch all data (we will paginate manually after filtering)
        $allResults = $query->get();

        // Group by product_id
        $groupedResults = $allResults->groupBy('product_id')->map(function ($items) {
            $first = $items->first();

            // Defensive checks to prevent null errors
            if (!$first || !$first->product || !$first->whList) {
                return null;
            }

            $totalQty = $items->sum('qty');
            $totalAllocatedQty = $items->sum('allocated_qty');
            $remainingQty = $totalQty - $totalAllocatedQty;

            if ($remainingQty === 0) {
                return null; // skip if rem_qty is 0
            }

            $warehouses = $items->pluck('warehouse')->unique();
            $warehouseLabelEn = $warehouses->count() > 1 ? 'Multiple' : $first->whList->warehouse_en;
            $warehouseLabelCn = $warehouses->count() > 1 ? '数张账单' : $first->whList->warehouse_cn;

            // Fetch retail price
            $retail = Price_setup::where('type', 'retail')
                ->where('product_id', $first->product->id)
                ->where('customer_group_id', 6)
                ->first();

            $retailPrice = $retail->retail_price ?? 0;
            $retailCurrency = $retail->currency ?? '';

            $itemCost = $first->product->item_cost ?? 0;
            $totalCost = $remainingQty * $itemCost;

            // Get GRN date for age
            $grnDetails = Grn_details::where('product_id', $first->product->id)
                ->orderBy('grn_date', 'asc')
                ->first();

            $ageDay = $grnDetails ? \Carbon\Carbon::parse($grnDetails->grn_date)->diffInDays(now()) : 0;
            $datetime = $first->product->update_at;
            $version = date('YmdHis', strtotime($datetime));
            return [
                'product_id' => $first->product->id ?? '',
                'product_code' => $first->product->product_code ?? '',
                'product_title_en' => $first->product->product_title_en ?? '',
                'product_title_cn' => $first->product->product_title_cn ?? '',
                'product_thumbnail' => 'products/thumbnail/'.$first->product->product_code.'_thumbnail.webp?v=' . $version,
                'retail_price' => $retailPrice,
                'retail_currency' => $retailCurrency,
                'warehouse_code' => $first->warehouse ?? '',
                'warehouse_en' => $warehouseLabelEn,
                'warehouse_cn' => $warehouseLabelCn,
                'item_cost' => $itemCost,
                'hold_qty' => $first->product->hold_qty ?? 0,
                'allocated_qty' => $totalAllocatedQty,
                'last_sold_date' => $first->product->last_sold_date ?? '',
                'qty' => $totalQty,
                'rem_qty' => $remainingQty,
                'total_cost' => $totalCost,
                'age_day' => $ageDay,
                'new_hold_qty' => $first->product->hold_qty > 0 ? $first->product->hold_qty : 0,
                'details' => $items->map(function ($inv) use ($retailPrice, $ageDay, $retailCurrency) {
                    $totalCost = ($inv->qty - $inv->allocated_qty) * $inv->product->item_cost;
                    return [
                        'id' => $inv->id,
                        'product_id' => $inv->product_id,
                        'warehouse_en' => $inv->whList->warehouse_en,
                        'warehouse_cn' => $inv->whList->warehouse_cn,
                        'qty' => $inv->qty,
                        'allocated_qty' => $inv->allocated_qty,
                        'rem_qty' => $inv->qty - $inv->allocated_qty,
                        'item_cost' => $inv->product->item_cost,
                        'total_cost' => $totalCost,
                        'retail_price' => $retailPrice,
                        'retail_currency' => $retailCurrency,
                        'age_day' => $ageDay,
                    ];
                }),
            ];
        })->filter()->values(); // remove nulls and reset indexes

        // Manual pagination
        $total = $groupedResults->count();
        $lastPage = $perPage === -1 ? 1 : (int) ceil($total / $perPage);
        $paginated = $perPage === -1
            ? $groupedResults
            : $groupedResults->slice(($currentPage - 1) * $perPage, $perPage)->values();

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => [
                'current_page' => $currentPage,
                'data' => $paginated,
                'last_page' => $lastPage,
                'per_page' => $perPage === -1 ? $total : $perPage,
                'total' => $total,
            ],
        ]);
    }
    public function getWithdrawList(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');
        $currentPage = max(1, (int) $request->input('page', 1));

        $sortId = $request->input('sortId', []);
        // If sortId is not an array, convert it to an array
        if (!is_array($sortId)) {
            $sortId = explode(',', $sortId);  // Convert comma-separated string to array
            $query = Inventory_tblmaster::with(['product', 'whList'])
                ->whereIn('product_id',$sortId)
                ->orderByDesc('id');
        }
        else{
            $query = Inventory_tblmaster::with(['product', 'whList'])->orderByDesc('id');
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('warehouse', 'like', "%{$search}%")
                    ->orWhereHas('product', function ($q) use ($search) {
                        $q->where('product_code', 'like', "%{$search}%")
                            ->orWhere('product_title_en', 'like', "%{$search}%")
                            ->orWhere('product_title_cn', 'like', "%{$search}%");
                    });
            });
        }

        $results = $query->get()->filter(function ($item) {
            $remQty = $item->qty - $item->allocated_qty;
            return $item->product && $item->whList && $remQty > 0;
        })->map(function ($inv) {
            $retail = Price_setup::where('type', 'retail')
                ->where('product_id', $inv->product->id)
                ->where('customer_group_id', 6)
                ->first();

            $retailPrice = $retail->retail_price ?? 0;
            $retailCurrency = $retail->currency ?? '';

            $grnDetails = Grn_details::where('product_id', $inv->product->id)
                ->orderBy('grn_date', 'asc')
                ->first();

            $ageDay = $grnDetails ? \Carbon\Carbon::parse($grnDetails->grn_date)->diffInDays(now()) : 0;

            $remQty = $inv->qty - $inv->allocated_qty;
            $totalCost = $remQty * ($inv->product->item_cost ?? 0);
            $datetime = $inv->product->updated_at;
            $version = date('YmdHis', strtotime($datetime));

            return [
                'id' => $inv->id,
                'product_id' => $inv->product->id ?? '',
                'product_code' => $inv->product->product_code ?? '',
                'product_title_en' => $inv->product->product_title_en ?? '',
                'product_title_cn' => $inv->product->product_title_cn ?? '',
                'retail_price' => $retailPrice,
                'retail_currency' => $retailCurrency,
                'warehouse_code' => $inv->warehouse ?? '',
                'warehouse_en' => $inv->whList->warehouse_en ?? '',
                'warehouse_cn' => $inv->whList->warehouse_cn ?? '',
                'item_cost' => $inv->product->item_cost ?? 0,
                'hold_qty' => $inv->product->hold_qty ?? 0,
                'allocated_qty' => $inv->allocated_qty,
                'last_sold_date' => $inv->product->last_sold_date ?? '',
                'qty' => $inv->qty,
                'rem_qty' => $remQty,
                'total_cost' => $totalCost,
                'age_day' => $ageDay,
                'new_hold_qty' => 0,
                'purpose' => null,
                'new_qty' => 0,
                'is_hold' => 0,
            ];
        })->values();

        $total = $results->count();
        $lastPage = $perPage === -1 ? 1 : (int) ceil($total / $perPage);
        $paginated = $perPage === -1
            ? $results
            : $results->slice(($currentPage - 1) * $perPage, $perPage)->values();

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => [
                'current_page' => $currentPage,
                'data' => $paginated,
                'last_page' => $lastPage,
                'per_page' => $perPage === -1 ? $total : $perPage,
                'total' => $total,
            ],
        ]);
    }
    public function updateWithdrawInventory(Request $request){
        $resultArray = [];

        DB::beginTransaction(); // Begin transaction

        try {
            if ($request->has('details')) {
                foreach ($request->details as $list) {
                    if (is_string($list)) {
                        $list = json_decode($list, true);
                    }

                    $product_id = $list['product_id'];
                    $new_qty = $list['new_qty'];

                    // First try: Find a GRN with enough remaining quantity
                    $grn = Grn_details::selectRaw("id, (qty - COALESCE(allocation, 0)) AS rem_qty, grn_no")
                        ->where('product_id', $product_id)
                        ->whereRaw('(qty - COALESCE(allocation, 0)) >= ?', [$new_qty])
                        ->orderByRaw('ABS((qty - COALESCE(allocation, 0)) - ?)', [$new_qty])
                        ->first();

                    if ($grn) {
                        $resultArray[] = [
                            'qty' => $new_qty,
                            'grn_id' => $grn->id,
                            'grn_no' => $grn->grn_no,
                            'warehouse' => $list['warehouse'],
                            'product_id' => $list['product_id'],
                            'purpose' => $list['purpose'],
                            'price' => $list['price'],
                            'currency' => $list['currency'],
                            'is_hold' => $list['is_hold'],
                        ];
                    } else {
                        // Fallback logic
                        $fallbackGrns = Grn_details::selectRaw("id, (qty - COALESCE(allocation, 0)) AS rem_qty, grn_no")
                            ->where('product_id', $product_id)
                            ->whereRaw('(qty - COALESCE(allocation, 0)) > 0')
                            ->orderBy('grn_date', 'asc')
                            ->get();

                        $remainingQty = $new_qty;

                        foreach ($fallbackGrns as $fallback) {
                            if ($remainingQty <= 0) break;

                            $useQty = min($fallback->rem_qty, $remainingQty);

                            $resultArray[] = [
                                'qty' => $useQty,
                                'grn_id' => $fallback->id,
                                'grn_no' => $fallback->grn_no,
                                'warehouse' => $list['warehouse'],
                                'product_id' => $list['product_id'],
                                'purpose' => $list['purpose'],
                                'price' => $list['price'],
                                'currency' => $list['currency'],
                                'is_hold' => $list['is_hold'],
                            ];

                            $remainingQty -= $useQty;
                        }
                    }
                }

                // Insert all allocations
                foreach ($resultArray as $item) {
                    $total = $item['qty'] * $item['price'];
                    $is_hold = $item['is_hold'];
                    if($is_hold > 0){
                        Products::where('id', $item['product_id'])
                            ->where('hold_qty', '>', 0)
                            ->update(['hold_qty' => DB::raw('hold_qty - ' . (int) $item['qty'])]);
                    }
                    $inserMaster = [
                        'account_no' => $item['purpose'],
                        'currency' => $item['currency'],
                        'product_id' => $item['product_id'],
                        'qty' => $item['qty'],
                        'price' => $item['price'],
                        'total' => $total,
                        'warehouse' => $item['warehouse'],
                        'pod' => $item['warehouse'],
                        'grn_detail_id' => $item['grn_id'],
                        'grn_no' => $item['grn_no'],
                        'allocated_qty' => 0,
                        'invoice_no' => '',
                    ];

                    Inventory_allocation::create($inserMaster);

                    $product_code = Products::where('id',$item['product_id'])->value('product_code');
                    $globalController = new GlobalController();
                    $globalController->logAction(
                        'Inventory', 't_inventory_tblmaster',
                        'insert',
                        'Withdraw ' . $product_code . ' from inventory - Qty : ' . $item['qty']
                    );
                }

                event(new ProductEvent('insert'));
                event(new AllocationEvent('insert'));
                event(new InventoryEvent('insert'));

                DB::commit(); // Commit transaction
                return response()->json([
                    'token'     => 'Success',
                    'message'   => 'Item(s) Successfully withdrawn',
                    'action'    => 'insert'
                ]);
            }
            return response()->json([
                'token'     => 'Error',
                'message'   => 'No details found.',
                'action'    => 'insert'
            ]);
        } catch (\Exception $e) {
            DB::rollBack(); // Rollback on error
            return response()->json([
                'token'     => 'Error',
                'message'   => $e->getMessage(),
                'id'        => 0,
                'action'    =>'insert'
            ]);
        }
    }
}
