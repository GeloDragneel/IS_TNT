<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Supplier;
use App\Events\SupplierEvent;
use App\Models\Accounts_payable_master;
use App\Models\POrder_master;
use App\Models\POrder_detail;
use App\Models\Grn_details;
use App\Models\Accounts_payable_details;
use App\Models\Account_supplier_invoice;
use App\Models\Account_supplier_cn;
use App\Models\Payment_voucher_detail;
use App\Models\Credit_note_supplier_detail;
use App\Models\Charts_of_account;
use App\Models\Grn_master;
use App\Events\LogEvent;
class SupplierController extends Controller
{
    
    public function getAllSupplier(Request $request)
    {
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        // Start with the query builder, not the collection
        $query = Supplier::where('is_deleted', 0)
            ->orderBy('id', 'desc');

        // Apply search if provided
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('supplier_code', 'like', "%{$search}%")
                    ->orWhere('suppliername_en', 'like', "%{$search}%")
                    ->orWhere('suppliername_cn', 'like', "%{$search}%")
                    ->orWhere('contact_person_en', 'like', "%{$search}%")
                    ->orWhere('contact_person_cn', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($supplier) {
            return [
                'id' => $supplier->id,
                'supplier_code' => $supplier->supplier_code,
                'suppliername_en' => $supplier->suppliername_en,
                'suppliername_cn' => $supplier->suppliername_cn == null ? $supplier->suppliername_en : $supplier->suppliername_cn,
                'contact_person_en' => $supplier->contact_person_en,
                'contact_person_cn' => $supplier->contact_person_cn == null ? $supplier->contact_person_en : $supplier->contact_person_cn,
                'contact_number' => $supplier->contact_number,
                'currency' => $supplier->currency,
                'shipping_terms_id' => $supplier->shipping_terms_id,
                'payment_terms_id' => $supplier->payment_terms_id,
                'delivery_method_id' => $supplier->delivery_method_id,
                'bank_name_en' => $supplier->bank_name_en,
                'bank_name_cn' => $supplier->bank_name_cn,
                'bank_account_name_en' => $supplier->bank_account_name_en,
                'bank_account_name_cn' => $supplier->bank_account_name_cn,
                'bank_account_no' => $supplier->bank_account_no,
                'bank_address_en' => $supplier->bank_address_en,
                'bank_address_cn' => $supplier->bank_address_cn,
                'bank_country' => $supplier->bank_country,
                'bank_country_state' => $supplier->bank_country_state,
                'supplier_address_en' => $supplier->supplier_address_en,
                'supplier_address_cn' => $supplier->supplier_address_cn,
                'bank_tel_no' => $supplier->bank_tel_no,
                'bank_swift_code' => $supplier->bank_swift_code,
                'bank_postal_code_2' => $supplier->bank_postal_code_2,
                'email' => $supplier->email,
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
    public function getSupplierInfo($id)
    {
        $supplier = Supplier::get()
            ->where('id', $id)
            ->where('is_deleted', 0)
            ->first();

        // ✅ Stop early if no product found
        if (!$supplier) {
            return response()->json([
                'success' => true,
                'message' => 'Supplier is empty',
            ]);
        }

        // Convert product to array and add genres as a separate key
        $SupplierData = $supplier->toArray();

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $SupplierData,
        ]);
    }
    public function delSupplier(Request $request)
    {
        $ids = $request->input('ids');
        $type = $request->input('type');

        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'No Supplier IDs provided'], 400);
        }

        foreach ($ids as $id) {
            $supplier = Supplier::find($id);
            if (!$supplier) continue;

            if ($type === 'soft') {

                $globalController = new GlobalController();
                $globalController->logAction(
                    'Supplier', 'm_suppliers',
                    'delete',
                    'Supplier Code : ' . $supplier->supplier_code
                );
                $supplier->is_deleted = 1;
                $supplier->save();
            } elseif ($type === 'hard') {

                $globalController = new GlobalController();
                $globalController->logAction(
                    'Supplier Archive', 'm_suppliers',
                    'delete',
                    'Supplier Code : ' . $supplier->supplier_code
                );

                $supplier->delete();
            } else {
                return response()->json(['message' => 'Invalid delete type'], 400);
            }
        }

        event(new SupplierEvent( 'delete'));
        event(new LogEvent( 'insert'));

        return response()->json(['message' => 'Supplier deleted']);
    }
    public function getSupplierExists($supplierCode){
        return Supplier::where('supplier_code', $supplierCode)->count();
    }
    public function updateSupplier(Request $request, $id)
    {
        $OrigID = $id;

        // Instantiate the service

        // If product ID is 0, create a new product
        if ((int) $id === 0) {
            // Prepare product data including status
            $SupplierData = $request->only([
                'supplier_code', 
                'old_supplier_code',
                'suppliername_en',
                'suppliername_cn',
                'contact_person_en',
                'contact_person_cn',
                'supplier_address_en',
                'supplier_address_cn',
                'contact_number',
                'country',
                'country_state',
                'postal_code',
                'fax',
                'email',
                'bank_name_en',
                'bank_name_cn',
                'bank_account_name_en',
                'bank_account_name_cn',
                'bank_account_no',
                'bank_address_en',
                'bank_address_cn',
                'bank_country',
                'bank_country_state',
                'bank_tel_no',
                'bank_swift_code',
                'bank_postal_code_2',
                'currency',
                'iban',
                'tax',
                'payment_terms_id',
                'shipping_terms_id',
                'delivery_method_id',
            ]);
            // Create product with status
            $supplier = Supplier::create($SupplierData);
            $id = $supplier->id; // update ID for image handling later
        } else {
            // Otherwise, find existing product
            $supplier = Supplier::find($id);

            // Prepare update data including the new status
            $updateData = $request->only([
                'supplier_code', 
                'old_supplier_code',
                'suppliername_en',
                'suppliername_cn',
                'contact_person_en',
                'contact_person_cn',
                'supplier_address_en',
                'supplier_address_cn',
                'contact_number',
                'country',
                'country_state',
                'postal_code',
                'fax',
                'email',
                'bank_name_en',
                'bank_name_cn',
                'bank_account_name_en',
                'bank_account_name_cn',
                'bank_account_no',
                'bank_address_en',
                'bank_address_cn',
                'bank_country',
                'bank_country_state',
                'bank_tel_no',
                'bank_swift_code',
                'bank_postal_code_2',
                'currency',
                'iban',
                'tax',
                'payment_terms_id',
                'shipping_terms_id',
                'delivery_method_id',
            ]);
            $supplier->update($updateData);
        }

        $Action = ($OrigID === 0 ? 'insert' : 'update');

        $globalController = new GlobalController();
        $globalController->logAction(
            'Supplier', 'm_suppliers',
            $Action,
            'Supplier Code : ' . $request->supplier_code
        );

        event(new SupplierEvent( $Action));
        event(new LogEvent( 'insert'));

        return response()->json([
            'message' => 'Supplier updated successfully',
            'id'      => $id,
            'action'  => $Action
        ]);
    }
    public function getSupplierInvoices($supplierId, Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search', '');

        $query = Accounts_payable_master::with(['supplier', 'invoiceStatus','apDetails'])
            ->where('supplier_id', $supplierId)
            ->orderBy('id', 'desc');

        $query->where(function ($q) use ($search) {
            $q->where('ap_number', 'like', "%{$search}%")
            ->orWhereHas('supplier', function ($q2) use ($search) {
                $q2->where('suppliername_en', 'like', "%{$search}%")
                    ->orWhere('suppliername_cn', 'like', "%{$search}%");
            })
            ->orWhereHas('invoiceStatus', function ($q3) use ($search) {
                $q3->where('status_value_en', 'like', "%{$search}%")
                    ->orWhere('status_value_cn', 'like', "%{$search}%");
            })
            ->orWhereHas('apDetails.product', function ($q4) use ($search) {
                $q4->where('product_code', 'like', "%{$search}%")
                    ->orWhere('product_title_en', 'like', "%{$search}%")
                    ->orWhere('product_title_cn', 'like', "%{$search}%")
                    ->orWhere('po_number', 'like', "%{$search}%");
            });
        });

        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Transform results to include related fields and pvoucher number
        $transform = function ($item) {
            $item->supplier_code = optional($item->supplier)->supplier_code;
            $item->suppliername_en = optional($item->supplier)->suppliername_en;
            $item->suppliername_cn = optional($item->supplier)->suppliername_cn;
            $item->invoice_status_en = optional($item->invoiceStatus)->status_value_en;
            $item->invoice_status_cn = optional($item->invoiceStatus)->status_value_cn;
            $item->pvoucher_no = \DB::table('t_pv_master')
                ->whereRaw("FIND_IN_SET(?, REPLACE(invoice_no, '|', ','))", [$item->ap_number])
                ->value('pv_number') ?? '';
            return $item;
        };

        $data = $perPage === -1
            ? $result->map($transform)
            : tap($result)->getCollection()->transform($transform);

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $perPage === -1
                ? [
                    'current_page' => 1,
                    'data' => $data,
                    'last_page' => 1,
                    'per_page' => $data->count(),
                    'total' => $data->count(),
                ]
                : $result,
        ]);
    }
    public function getSupplierInvoicesDetails($apInvoiceNo, Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search', '');

        $query = Accounts_payable_details::with(['product'])
            ->where('ap_number', $apInvoiceNo)
            ->orderBy('id', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('ap_number', 'like', "%{$search}%")
                ->orWhere('po_number','like',"%{$search}%")
                ->orWhereHas('product', function ($q2) use ($search) {
                    $q2->where('product_code', 'like', "%{$search}%");
                    $q2->where('product_title_en', 'like', "%{$search}%");
                    $q2->where('product_title_cn', 'like', "%{$search}%");
                });
            });
        }

        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Transform results to include related fields and pvoucher number
        $transform = function ($item) {
            $item->product_code = optional($item->product)->product_code;
            $item->product_title_en = optional($item->product)->product_title_en;
            $item->product_title_cn = optional($item->product)->product_title_cn;
            return $item;
        };


        $data = $perPage === -1
            ? $result->map($transform)
            : tap($result)->getCollection()->transform($transform);

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $data
        ]);
    }
    public function getSupplierPrepaid($supplierId, Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search', '');

        $query = POrder_master::with(['details.product'])
            ->where('supplier_id', $supplierId)
            ->where('deposit', '>', 0)
            ->where('postatus_id', '!=', 3)
            ->orderByDesc('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                ->orWhereHas('details.product', function ($q2) use ($search) {
                    $q2->where('product_code', 'like', "%{$search}%")
                        ->orWhere('product_title_en', 'like', "%{$search}%")
                        ->orWhere('product_title_cn', 'like', "%{$search}%");
                });
            });
        }

        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Transform result
        $transform = function ($item) {
            $item->pvoucher_no = $item->pvoucher_no;
            return $item;
        };

        $data = $perPage === -1
            ? $result->map($transform)
            : tap($result)->getCollection()->transform($transform);

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $perPage === -1
                ? [
                    'current_page' => 1,
                    'data' => $data,
                    'last_page' => 1,
                    'per_page' => $data->count(),
                    'total' => $data->count(),
                ]
                : $result,
        ]);
    }
    public function getSupplierPrepaidDetails($refData, Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search', '');

        $query = Payment_voucher_detail::with(['product'])
            ->where('pv_number', $refData)
            ->orderBy('id', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('pv_number', 'like', "%{$search}%")
                ->orWhereHas('product', function ($q2) use ($search) {
                    $q2->where('product_code', 'like', "%{$search}%");
                    $q2->where('product_title_en', 'like', "%{$search}%");
                    $q2->where('product_title_cn', 'like', "%{$search}%");
                });
            });
        }

        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Transform results to include related fields and pvoucher number
        $transform = function ($item) {
            $item->product_code = optional($item->product)->product_code;
            $item->product_title_en = optional($item->product)->product_title_en;
            $item->product_title_cn = optional($item->product)->product_title_cn;
            return $item;
        };


        $data = $perPage === -1
            ? $result->map($transform)
            : tap($result)->getCollection()->transform($transform);

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $data
        ]);
    }
    public function getSupplierProfitability(Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search');

        $query = POrder_detail::with(['product', 'poStatus'])
            ->whereNotNull('product_id')
            ->when($search, function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                ->orWhereHas('product', function ($q2) use ($search) {
                    $q2->where('product_title_en', 'like', "%{$search}%")
                        ->orWhere('product_title_cn', 'like', "%{$search}%")
                        ->orWhere('product_code', 'like', "%{$search}%");
                });
            });

        $collection = $query->get();

        $grouped = $collection->groupBy('product_id')->map(function ($group) {
            $first = $group->first();
            $product = $first->product;

            if (!$product) {
                return [
                    'id' => $first->id,
                    'po_number' => $first->po_number,
                    'postatus_id' => $first->postatus_id,
                    'product_code' => $first->product_code,
                    'po_status_en' => $first->poStatus->postatus_en,
                    'po_status_cn' => $first->poStatus->postatus_cn,
                    'product_title_en' => '',
                    'product_title_cn' => '',
                    'total_sales' => 0,
                    'total_cost' => 0,
                    'total_profit' => 0,
                ];
            }

            $invoiceDetails = $product->invoiceDetails;

            $totalSales = $invoiceDetails->sum(function ($detail) {
                return $detail->total * $detail->ex_rate;
            });

            $totalCost = $invoiceDetails->sum(function ($detail) use ($product) {
                return $product->item_cost * $detail->qty;
            });

            return [
                'id' => $first->id,
                'po_number' => $first->po_number,
                'postatus_id' => $first->postatus_id,
                'product_code' => $product->product_code,
                'po_status_en' => $first->poStatus->postatus_en,
                'po_status_cn' => $first->poStatus->postatus_cn,
                'product_title_en' => $product->product_title_en ?? '',
                'product_title_cn' => $product->product_title_cn ?? '',
                'total_sales' => round($totalSales, 2),
                'total_cost' => round($totalCost, 2),
                'total_profit' => round($totalSales - $totalCost, 2),
                'profit_percentage' => $totalCost > 0 
                    ? (int)(($totalSales - $totalCost) / $totalCost * 100) 
                    : 0,
            ];
        })->values();

        $paginated = $perPage === -1
            ? $grouped
            : $grouped->forPage($request->input('page', 1), $perPage)->values();

        // Calculate totals for paginated and overall grouped data
        $paginatedTotals = [
            'total_sales' => $paginated->sum('total_sales'),
            'total_cost' => $paginated->sum('total_cost'),
            'total_profit' => $paginated->sum('total_profit'),
        ];

        $groupedTotals = [
            'total_sales' => $grouped->sum('total_sales'),
            'total_cost' => $grouped->sum('total_cost'),
            'total_profit' => $grouped->sum('total_profit'),
        ];

        $paginatedTotals['profit_percentage'] = $paginatedTotals['total_cost'] > 0
            ? (int) (($paginatedTotals['total_profit'] / $paginatedTotals['total_cost']) * 100)
            : 0;

        $groupedTotals['total_profit_percentage'] = $groupedTotals['total_cost'] > 0
            ? (int) (($groupedTotals['total_profit'] / $groupedTotals['total_cost']) * 100)
            : 0;

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $perPage === -1
                ? [
                    'current_page' => 1,
                    'data' => $paginated,
                    'last_page' => 1,
                    'per_page' => $paginated->count(),
                    'total' => $paginated->count(),
                    'footer' => $groupedTotals,
                ]
                : [
                    'current_page' => $request->input('page', 1),
                    'data' => $paginated,
                    'last_page' => ceil($grouped->count() / $perPage),
                    'per_page' => $perPage,
                    'total' => $grouped->count(),
                    'footer' => $groupedTotals,
                ],
            'overall_totals' => $groupedTotals,
        ]);
    }

    public function getSupplierReceiveItems($supplierId, Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search', '');

        // Build the query using only Eloquent relationships
        $query = Grn_details::with(['product', 'pOrderDetail'])
            ->where('supplier_id', $supplierId)
            ->orderByDesc('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('grn_no', 'like', "%{$search}%")
                ->orWhere('ap_invoice_no', 'like', "%{$search}%")
                ->orWhereHas('product', function ($q2) use ($search) {
                    $q2->where('product_title_en', 'like', "%{$search}%")
                        ->orWhere('product_title_cn', 'like', "%{$search}%")
                        ->orWhere('product_code', 'like', "%{$search}%");
                })
                ->orWhereHas('pOrderDetail', function ($q3) use ($search) {
                    $q3->where('po_number', 'like', "%{$search}%");
                });
            });
        }

        $result = $perPage === -1
            ? $query->get()
            : $query->paginate($perPage);

        // Transform each item
        $transform = function ($item) {

            $apInv = Accounts_payable_details::where('po_detail_id', $item->po_id)
                ->where('product_id', $item->product_id)
                ->first();

            return [
                'ID'                => $item->id,
                'grn_date'          => $item->grn_date,
                'grn_no'            => $item->grn_no,
                'product_id'        => $item->product_id,
                'product_code'      => $item->product->product_code,
                'product_title_en'  => $item->product->product_title_en ?? null,
                'product_title_cn'  => $item->product->product_title_cn ?? null,
                'currency'          => $item->currency,
                'total'             => $item->total,
                'base_total'        => $item->base_total,
                'po_detail_id'      => $item->po_id,
                'old_ap_invoice_no' => $item->ap_invoice_no,
                'ap_invoice_no'     => $apInv->ap_number ?? 0,
                'po_number'         => $item->pOrderDetail->po_number ?? null,
                'received_qty'      => $item->received_qty,
            ];
        };

        $data = $perPage === -1
            ? $result->map($transform)
            : tap($result)->getCollection()->transform($transform);

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $perPage === -1
                ? [
                    'current_page' => 1,
                    'data'         => $data,
                    'last_page'    => 1,
                    'per_page'     => $data->count(),
                    'total'        => $data->count(),
                ]
                : $result,
        ]);
    }
    public function getSupplierItemsOnPO($supplierId, Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search', '');

        $query = POrder_master::with(['supplier', 'invoiceStatus','details'])
            ->where('supplier_id', $supplierId)
            ->where('postatus_id','!=',3)
            ->orderBy('id', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                ->orWhereHas('supplier', function ($q2) use ($search) {
                    $q2->where('supplier_code', 'like', "%{$search}%");
                    $q2->where('suppliername_en', 'like', "%{$search}%");
                    $q2->where('suppliername_cn', 'like', "%{$search}%");
                })
                ->orWhereHas('invoiceStatus', function ($q3) use ($search) {
                    $q3->where('postatus_en', 'like', "%{$search}%")
                        ->orWhere('postatus_cn', 'like', "%{$search}%");
                })
                ->orWhereHas('details.product', function ($q4) use ($search) {
                    $q4->where('product_code', 'like', "%{$search}%")
                        ->orWhere('product_title_en', 'like', "%{$search}%")
                        ->orWhere('product_title_cn', 'like', "%{$search}%");
                });
            });
        }

        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Transform results to include related fields and pvoucher number
        $transform = function ($item) {
            $item->supplier_code = optional($item->supplier)->supplier_code;
            $item->suppliername_en = optional($item->supplier)->suppliername_en;
            $item->suppliername_cn = optional($item->supplier)->suppliername_cn;
            $item->postatus_en = optional($item->invoiceStatus)->postatus_en;
            $item->postatus_cn = optional($item->invoiceStatus)->postatus_cn;
            return $item;
        };

        $data = $perPage === -1
            ? $result->map($transform)
            : tap($result)->getCollection()->transform($transform);

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $perPage === -1
                ? [
                    'current_page' => 1,
                    'data' => $data,
                    'last_page' => 1,
                    'per_page' => $data->count(),
                    'total' => $data->count(),
                ]
                : $result,
        ]);
    }

    public function getSupplierItemsOnPODetail($refData, Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search', '');

        $query = POrder_detail::with(['product'])
            ->where('po_number', $refData)
            ->orderBy('id', 'asc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('po_number', 'like', "%{$search}%")
                ->orWhereHas('product', function ($q2) use ($search) {
                    $q2->where('product_code', 'like', "%{$search}%");
                    $q2->where('product_title_en', 'like', "%{$search}%");
                    $q2->where('product_title_cn', 'like', "%{$search}%");
                });
            });
        }

        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Transform results to include related fields and pvoucher number
        $transform = function ($item) {
            $item->product_code = optional($item->product)->product_code;
            $item->product_title_en = optional($item->product)->product_title_en;
            $item->product_title_cn = optional($item->product)->product_title_cn;
            return $item;
        };


        $data = $perPage === -1
            ? $result->map($transform)
            : tap($result)->getCollection()->transform($transform);

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $data
        ]);
    }

    public function getSupplierTransInfo($supplierId, Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search', '');

        $query = Account_supplier_invoice::with(['supplier'])
            ->where('supplier_id', $supplierId)
            ->orderBy('id', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('ap_invoice_no', 'like', "%{$search}%")
                ->orWhere('pv_number','like',"%{$search}%")
                ->orWhereHas('supplier', function ($q2) use ($search) {
                    $q2->where('supplier_code', 'like', "%{$search}%");
                    $q2->where('suppliername_en', 'like', "%{$search}%");
                    $q2->where('suppliername_cn', 'like', "%{$search}%");
                });
            });
        }

        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Transform results to include related fields and pvoucher number
        $transform = function ($item) {
            $item->supplier_code = optional($item->supplier)->supplier_code;
            $item->suppliername_en = optional($item->supplier)->suppliername_en;
            $item->suppliername_cn = optional($item->supplier)->suppliername_cn;
            $item->trans_info = ($item->pv_detail_id > 0 ? $item->pv_number : $item->ap_invoice_no);
            $item->trans_type = ($item->pv_detail_id > 0 ? 'PV' : 'AP');
            return $item;
        };

        $data = $perPage === -1
            ? $result->map($transform)
            : tap($result)->getCollection()->transform($transform);

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $perPage === -1
                ? [
                    'current_page' => 1,
                    'data' => $data,
                    'last_page' => 1,
                    'per_page' => $data->count(),
                    'total' => $data->count(),
                ]
                : $result,
        ]);
    }

    public function getAccountsPayable($supplierId, Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search', '');

        $query = Grn_master::with(['supplier', 'grnDetails.product'])
            ->select(
                't_grn_master.id',
                't_grn_master.grn_no',
                't_grn_master.supplier_id',
                't_grn_master.grn_date',
                't_grn_master.total',
                't_grn_master.base_total',
                't_grn_master.ex_rate',
                't_grn_master.currency',
                DB::raw('COALESCE(SUM(t_porder_detail.deposit), 0) AS deposit'),
                DB::raw('COALESCE(SUM(t_porder_detail.base_deposit), 0) AS base_deposit')
            )
            ->join('t_grn_detail', 't_grn_detail.grn_no', '=', 't_grn_master.grn_no')
            ->leftJoin('t_ap_detail', function ($join) {
                $join->on('t_ap_detail.product_id', '=', 't_grn_detail.product_id')
                    ->on('t_ap_detail.po_number', '=', 't_grn_detail.po_number');
            })
            ->leftJoin('t_ap_master', 't_ap_master.ap_number', '=', 't_ap_detail.ap_number')
            ->leftJoin('t_porder_detail', function ($join) {
                $join->on('t_porder_detail.po_number', '=', 't_grn_detail.po_number')
                    ->on('t_porder_detail.product_id', '=', 't_grn_detail.product_id');
            })
            ->where('t_grn_master.supplier_id', $supplierId)
            ->where('t_grn_master.grn_status_id', 2)
            ->where('t_grn_master.imported', 0)
            ->where('t_grn_master.imported', 0)
            ->whereRaw('COALESCE(t_ap_master.invoice_status_id, 0) <> 1')
            ->whereNotNull('t_grn_detail.product_id') // <-- This line added
            ->groupBy(
                't_grn_master.id',
                't_grn_master.grn_no',
                't_grn_master.supplier_id',
                't_grn_master.grn_date',
                't_grn_master.total',
                't_grn_master.base_total',
                't_grn_master.ex_rate',
                't_grn_master.currency'
            )
            ->havingRaw('SUM(t_grn_master.total) - COALESCE(SUM(t_porder_detail.deposit), 0) > 0')
            ->orderByDesc('t_grn_master.id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('t_grn_master.grn_no', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($q2) use ($search) {
                        $q2->where('supplier_code', 'like', "%{$search}%")
                        ->orWhere('suppliername_en', 'like', "%{$search}%")
                        ->orWhere('suppliername_cn', 'like', "%{$search}%");
                    })
                    ->orWhereHas('grnDetails.product', function ($q2) use ($search) {
                        $q2->where('product_code', 'like', "%{$search}%")
                        ->orWhere('product_title_en', 'like', "%{$search}%")
                        ->orWhere('product_title_cn', 'like', "%{$search}%");
                    });
            });
        }

        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        $transform = function ($item) {
            $item->supplier_code = optional($item->supplier)->supplier_code;
            $item->suppliername_en = optional($item->supplier)->suppliername_en;
            $item->suppliername_cn = optional($item->supplier)->suppliername_cn;
            $item->balance = (float) $item->total - (float) $item->deposit;
            return $item;
        };

        $data = $perPage === -1
            ? $result->map($transform)
            : tap($result)->getCollection()->transform($transform);

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $perPage === -1
                ? [
                    'current_page' => 1,
                    'data' => $data,
                    'last_page' => 1,
                    'per_page' => $data->count(),
                    'total' => $data->count(),
                ]
                : $result,
        ]);
    }


    public function getAccountsPayableDetail($refData, Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search', '');

        // Build the query using only Eloquent relationships
        $query = Grn_details::with(['product', 'pOrderDetail'])
            ->where('grn_no', $refData)
            ->orderByDesc('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('grn_no', 'like', "%{$search}%")
                ->orWhere('ap_invoice_no', 'like', "%{$search}%")
                ->orWhereHas('product', function ($q2) use ($search) {
                    $q2->where('product_title_en', 'like', "%{$search}%")
                        ->orWhere('product_title_cn', 'like', "%{$search}%")
                        ->orWhere('product_code', 'like', "%{$search}%");
                })
                ->orWhereHas('pOrderDetail', function ($q3) use ($search) {
                    $q3->where('po_number', 'like', "%{$search}%");
                });
            });
        }

        $result = $perPage === -1
            ? $query->get()
            : $query->paginate($perPage);

        // Transform each item
        $transform = function ($item) {

            return [
                'ID'                => $item->id,
                'grn_date'          => $item->grn_date,
                'grn_no'            => $item->grn_no,
                'product_id'        => $item->product_id,
                'product_code'      => $item->product->product_code ?? null,
                'product_title_en'  => $item->product->product_title_en ?? null,
                'product_title_cn'  => $item->product->product_title_cn ?? null,
                'currency'          => $item->currency,
                'total'             => $item->total,
                'price'             => $item->price,
                'qty'               => $item->qty,
                'base_total'        => $item->base_total,
                'invoice_deposit'   => $item->invoice_deposit,
                'po_detail_id'      => $item->po_id,
                'old_ap_invoice_no' => $item->ap_invoice_no,
                'po_number'         => $item->pOrderDetail->po_number ?? null,
                'received_qty'      => $item->received_qty,
            ];
        };

        $data = $perPage === -1
            ? $result->map($transform)
            : tap($result)->getCollection()->transform($transform);

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $data
        ]);
    }
    public function getSupplierCredit($supplierId, Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search', '');

        $query = Account_supplier_cn::selectRaw("
            MAX(id) AS ids,
            MAX(currency) AS currency,
            GROUP_CONCAT(DISTINCT account_code) AS account_code,
            ref_data,
            GROUP_CONCAT(DISTINCT particulars ORDER BY particulars ASC SEPARATOR '; ') AS particulars,
            GROUP_CONCAT(DISTINCT cr_number ORDER BY cr_number ASC SEPARATOR ', ') AS cr_number,
            GROUP_CONCAT(DISTINCT transaction_date ORDER BY STR_TO_DATE(transaction_date, '%b %e %Y') DESC SEPARATOR ', ') AS transaction_date,
            SUM(amount) AS total_amount,
            SUM(base_amount) AS total_base_amount,
            SUM(debit) AS total_debit,
            SUM(credit) AS total_credit,
            MAX(STR_TO_DATE(transaction_date, '%b %e %Y')) AS max_date
        ")
        ->where('supplier_id', $supplierId)
        ->groupBy('ref_data');

        // Apply search if needed
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('ref_data', 'like', "%{$search}%")
                    ->orWhere('cr_number', 'like', "%{$search}%")
                    ->orWhere('particulars', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($q2) use ($search) {
                        $q2->where('supplier_code', 'like', "%{$search}%")
                            ->orWhere('supplier_name', 'like', "%{$search}%");
                    });
            });
        }

        // Sort ASC to compute running balance correctly
        $result = $query->orderByRaw('MAX(STR_TO_DATE(transaction_date, "%b %e %Y")) ASC')->get();

        // Step 1: Compute running balance in ASC order
        $runningBalance = 0;
        $computed = $result->map(function ($item) use (&$runningBalance) {
            $credit = (float) $item->total_credit;
            $debit  = (float) $item->total_debit;
            $runningBalance += ($credit - $debit);

            $account_type = '';
            if($item->account_code === '12409'){
                $account_type = 'CR';
            }
            if($item->account_code === '12410'){
                $account_type = 'PO';
            }
            if($item->account_code === '12404'){
                $account_type = 'INV';
            }

            return [
                'id'                => $item->ids,
                'table_id'          => $item->table_id,
                'account_code'      => $item->account_code,
                'ref_data'          => $item->ref_data,
                'cr_number'         => $item->cr_number,
                'particulars'       => $item->particulars,
                'currency'          => $item->currency,
                'amount'            => $item->total_amount,
                'base_amount'       => $item->total_base_amount,
                'debit'             => $debit,
                'credit'            => $credit,
                'running_balance'   => round($runningBalance, 2),
                'transaction_date'  => $item->transaction_date,
                'account_type'      => $account_type,
            ];
        });

        // Step 2: Reverse to get latest transaction first (DESC)
        $data = $computed->reverse()->values();

        // Step 3: Paginate if required
        if ($perPage !== -1) {
            $page = max((int) $request->input('page', 1), 1);
            $paginated = $data->forPage($page, $perPage)->values();
            $response = [
                'current_page' => $page,
                'data'         => $paginated,
                'last_page'    => (int) ceil($data->count() / $perPage),
                'per_page'     => $perPage,
                'total'        => $data->count(),
            ];
        } else {
            $response = [
                'current_page' => 1,
                'data'         => $data,
                'last_page'    => 1,
                'per_page'     => $data->count(),
                'total'        => $data->count(),
            ];
        }

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list'    => $response,
        ]);
    }
    public function getSupCreditDetails($refNumber,$type)
    {

        switch (strtoupper($type)) {
            case 'CR':
                $results = Credit_note_supplier_detail::with(['product'])
                    ->where('cr_number', $refNumber)
                    ->get()
                    ->map(function ($item) {

                    $chartOfAccount = Charts_of_account::where('account_code', $item->account_code)
                        ->first();

                        return [
                            'id' => $item->id,
                            'account_code' => $item->account_code,
                            'cr_number' => $item->cr_number,
                            'particulars' => $item->particulars,
                            'description_en' => $item->chartOfAccount?->account_name_en,
                            'description_cn' => $item->chartOfAccount?->account_name_cn,
                            'product_id' => $item->product_id,
                            'product_code' => $item->product?->product_code,
                            'product_title_en' => $item->product?->product_title_en,
                            'product_title_cn' => $item->product?->product_title_cn,
                            'currency' => $item->currency,
                            'ex_rate' => $item->ex_rate,
                            'amount' => $item->amount,
                            'base_amount' => $item->base_amount,
                        ];
                    });
                break;

            // Placeholder for other types (to be implemented)
            case 'PO': 
                $results = POrder_detail::with('product')
                    ->where('rv_number', $refNumber)
                    ->get()
                    ->map(function ($item) {
                        $product = $item?->product;
                        return [
                            'id' => $item->id,
                            'product_id' => $item?->product_id,
                            'product_code' => $product?->product_code,
                            'product_title_en' => $product?->product_title_en,
                            'product_title_cn' => $product?->product_title_cn,
                            'currency' => $product?->currency,
                            'qty' => $item->qty,
                            'price' => $item->price,
                            'deposit' => $item->deposit,
                        ];
                    });
                break;
            case 'INV': 
                $results = Accounts_payable_details::with(['product'])
                    ->where('invoice_no', $refNumber)
                    ->get()
                    ->map(function ($invDetail) {
                        // Check if product_id is null, then choose product or service
                        if ($invDetail->product_id) {
                            // Display product details if product_id is not null
                            $productTitle = $invDetail->product->product_title_en ?? $invDetail->productService->description_en;
                            $productTitleCN = $invDetail->product->product_title_cn ?? $invDetail->productService->description_cn;

                            return [
                                'id' => $invDetail->id,
                                'type' => 'products',
                                'table_id' => $invDetail->product_id,
                                'ap_date' => $invDetail->ap_date,
                                'po_number' => $invDetail->po_number,
                                'product_code' => $invDetail->product->product_code ?? null,
                                'product_title_en' => $productTitle,
                                'product_title_cn' => $productTitleCN,
                                'currency' => $invDetail->currency,
                                'qty' => $invDetail->qty,
                                'price' => $invDetail->price,
                                'total' => $invDetail->total,
                            ];
                        } else {
                            // Display service details if product_id is null
                            return [
                                'id' => $invDetail->id,
                                'type' => 'services',
                                'table_id' => $invDetail->product_id,
                                'ap_date' => $invDetail->ap_date,
                                'po_number' => $invDetail->po_number,
                                'product_code' => $invDetail->product->product_code ?? null,
                                'product_title_en' => $invDetail->product->product_title_en ?? null,
                                'product_title_cn' => $invDetail->product->product_title_cn ?? null,
                                'currency' => $invDetail->currency,
                                'qty' => $invDetail->qty,
                                'price' => $invDetail->price,
                                'total' => $invDetail->total,
                            ];
                        }
                    });
                break;

            default:
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid type specified.',
                    'list' => [],
                ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $results,
        ]);
    }
}
