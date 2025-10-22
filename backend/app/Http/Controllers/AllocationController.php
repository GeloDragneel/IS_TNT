<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\DB;
use App\Models\Grn_details;
use App\Models\Inventory_allocation;
use App\Models\Products;

use App\Events\ProductEvent;
use App\Events\AllocationEvent;
use App\Events\InventoryEvent;

use Illuminate\Http\Request;

class AllocationController extends Controller{

    public function getAllocationList(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Grn_details::with(['product'])->orderByRaw("DATE_FORMAT(STR_TO_DATE(grn_date, '%M %d %Y'), '%Y%m%d') DESC");

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('grn_no', 'like', "%{$search}%")
                    ->orWhereHas('product', function ($q) use ($search) {
                        $q->where('product_code', 'like', "%{$search}%")
                        ->orWhere('product_title_en', 'like', "%{$search}%")
                        ->orWhere('product_title_cn', 'like', "%{$search}%");
                    });
            });
        }
        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {
            $details = $this->AllocationDetails($list->id,$list->product_id,$list->warehouse);
            return [
                'id' => $list->id,
                'grn_no' => $list->grn_no,
                'grn_date' => $list->grn_date,
                'warehouse' => $list->warehouse,
                'product_id' => $list->product->id ?? '',
                'product_code' => $list->product->product_code ?? '',
                'product_title_en' => $list->product->product_title_en ?? '',
                'product_title_cn' => $list->product->product_title_cn ?? '',
                'received_qty' => $list->received_qty,
                'allocation' => $list->allocation,
                'qty' => $list->qty,
                'details' => $details,
            ];
        };

        // Apply transformation
        if ($perPage === -1) {
            $data = $result->map($transform);
            $response = [
                'current_page' => 1,
                'data' => $data,
                'last_page' => 1,
                'per_page' => $data->count(),
                'total' => $data->count(),
            ];
        } else {
            $data = $result->getCollection()->map($transform);
            $result->setCollection($data);
            $response = $result;
        }

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $response,
        ]);
    }
    public function AllocationDetails($grn_id, $product_id, $warehouse) {
        // Fetch the relevant data with relationships
        $query = Inventory_allocation::with(['chartOfAccount', 'customer','shippingStat'])
            ->where('product_id', $product_id)
            ->where('grn_detail_id', $grn_id)
            ->where('warehouse', $warehouse) // Add this if needed
            ->orderByDesc('id')
            ->get();  // This already returns a collection

        // Transform the data
        $transform = function ($list) {

            $customer_name_en = $list->customer->account_name_en ?? '';
            $customer_name_cn = $list->customer->account_name_cn ?? '';
            $customer_name_cn = ($customer_name_cn === '' ? $customer_name_en : $customer_name_cn);

            $shipping_stat_en = $list->shippingStat->shipping_stat_en ?? '';
            $shipping_stat_cn = $list->shippingStat->shipping_stat_cn ?? '';

            $account_name_en = $list->chartOfAccount->account_name_en ?? '';
            $account_name_cn = $list->chartOfAccount->account_name_cn ?? '';
            $account_name_cn = ($account_name_cn === '' ? $account_name_en : $account_name_cn);


            $is_account = 0;

            if($account_name_en === ''){
                $account_name_en = $customer_name_en;
                $account_name_cn = $customer_name_cn;
            }

            $customer_code = $list->customer->customer_code ?? '';
            if($customer_code === ''){
                $customer_code = $list->account_no;
                $is_account = 1;
            }

            return [
                'id' => $list->id ?? 0,
                'qty' => $list->qty,
                'warehouse' => $list->warehouse,
                'account_no' => $list->account_no,
                'so_number' => $list->so_number ?? '',
                'invoice_no' => $list->invoice_no ?? '',
                'customer_code' => $customer_code,
                'account_name_en' => $account_name_en,
                'account_name_cn' => $account_name_cn,
                'shipping_stat_en' => $shipping_stat_en,
                'shipping_stat_cn' => $shipping_stat_cn,
                'is_account' => $is_account,
            ];
        };
        // Apply the transformation and return
        return $query->map($transform);
    }
    public function delAllocation(Request $request){
        $ids = $request->input('ids');

        foreach ($ids as $id) {
            $allocation = Inventory_allocation::find($id);
            if (!$allocation) continue;
            
            $globalController = new GlobalController();
            $globalController->logAction(
                'Allocation', 't_inventory_allocation',
                'delete',
                'Account Code : ' . $allocation->account_no
            );
            $allocation->delete();
        }

        event(new ProductEvent( 'delete'));
        event(new AllocationEvent( 'delete'));
        event(new InventoryEvent( 'delete'));

        return response()->json(['message' => 'Allocation deleted']);
    }
    public function updateAllocation($qty, $id){
        DB::beginTransaction();
        try {
            $allocation = Inventory_allocation::find($id); // ✅ OK
            $allocation->qty = $qty;
            $allocation->save();

            event(new ProductEvent('update'));
            event(new AllocationEvent('update'));
            event(new InventoryEvent('update'));

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Record Successfully Updated',
                'action'  => 'update',
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'action'  => 'update',
            ], 500);
        }
    }

}
