<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; // ✅ This is required for DB::table()
use Illuminate\Pagination\LengthAwarePaginator;

use App\Models\Customer_credit;
use App\Models\Sales_order_detail;
use App\Models\Sales_order_detail_copy;
use App\Models\Customer_email;
use App\Models\Customer_group_list;
use App\Models\Customer_group;
use App\Models\Customer;
use App\Models\Orders;
use App\Models\Invoice_master;
use App\Models\Sales_order_master;
use App\Models\Payment_voucher_master;
use App\Models\Account_customer_cn;
use App\Models\Receive_voucher_detail;
use App\Models\Payment_orders_cn;
use App\Models\Invoice_detail;
use App\Models\Credit_note_customer_detail;
use App\Models\Receive_voucher_master;
use App\Models\Accounts_receivable;

use App\Events\CustomerEvent;
use App\Events\LogEvent;
use App\Services\BrevoService;
use Carbon\Carbon;
class CustomerController extends Controller{

    public function getAllCustomer(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        $query = Customer::with(['countryList', 'salesPerson','customer_group','podList','warehouseList'])
            ->where('is_deleted',0)
            ->orderBy('id', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('customer_code', 'like', "%{$search}%")
                    ->orWhere('account_name_en', 'like', "%{$search}%")
                    ->orWhere('account_name_cn', 'like', "%{$search}%")
                    ->orWhere('email_address', 'like', "%{$search}%")
                    ->orWhere('tel_no', 'like', "%{$search}%");
            });
        }

        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Transform results to include full name and country names
        $transform = function ($customer) {
            $customer->sales_person_name = optional($customer->salesPerson)->full_name;
            $customer->country_en = optional($customer->countryList)->country_en;
            $customer->country_cn = optional($customer->countryList)->country_cn;
            return $customer;
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
    public function getAllCustomerEmails(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        $query = Customer::with(['emails'])
            ->where('is_deleted', 0)
            ->where('is_subscribe', 1)
            ->where('status', 1)
            ->where('email_address', '<>' , '')
            ->whereHas('emails')
            ->orderBy('id', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('customer_code', 'like', "%{$search}%")
                    ->orWhere('account_name_en', 'like', "%{$search}%")
                    ->orWhere('account_name_cn', 'like', "%{$search}%")
                    ->orWhere('email_address', 'like', "%{$search}%")
                    ->orWhere('tel_no', 'like', "%{$search}%");
            });
        }

        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Transform to include only the required fields
        $transform = function ($customer) {
            $account_name_en = $customer->account_name_en;
            $account_name_cn = $customer->account_name_cn;
            $account_name_cn = ($account_name_cn === '' ? $account_name_en : $account_name_cn);
            return [
                'id' => $customer->id,
                'customer_code' => $customer->customer_code,
                'account_name_en' => $account_name_en,
                'account_name_cn' => $account_name_cn,
                'email_address' => $customer->email_address,
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
                    'data' => $data,
                    'last_page' => 1,
                    'per_page' => $data->count(),
                    'total' => $data->count(),
                ]
                : $result,
        ]);
    }

    public function getAllCustomerByCode(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');

        $query = Customer::with(['countryList', 'salesPerson','customer_group','podList','warehouseList'])
            ->where('is_deleted',0)
            ->orderBy('id', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('customer_code', 'like', "%{$search}%");
            });
        }

        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Transform results to include full name and country names
        $transform = function ($customer) {
            $customer->sales_person_name = optional($customer->salesPerson)->full_name;
            $customer->country_en = optional($customer->countryList)->country_en;
            $customer->country_cn = optional($customer->countryList)->country_cn;
            return $customer;
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
    public function getCustomerOrder($customerId, Request $request){
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search', '');

        // Use eager loading with selected columns only
        $query = Orders::with([
            'customer:id,customer_code,account_name_en,account_name_cn,sales_person_id',
            'product:id,product_code,product_title_en,product_title_cn',
            'salesPerson:id,firstname,middlename,lastname'
        ])
            ->where('show_category', 'orders')
            ->whereNotNull('product_id')
            ->where('customer_id', $customerId);

        // Search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('order_id', 'like', "%{$search}%")
                ->orWhereHas('product', function ($q2) use ($search) {
                    $q2->where('product_code', 'like', "%{$search}%")
                        ->orWhere('product_title_en', 'like', "%{$search}%")
                        ->orWhere('product_title_cn', 'like', "%{$search}%");
                });
            });
        }

        $query->orderByDesc('id');

        // Get footer (aggregate)
        $footer2 = $this->calculateCustomerOrderFooter(clone $query);

        // Paginate or get all
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Transform efficiently using map()
        $data = $result instanceof LengthAwarePaginator
            ? $result->getCollection()
            : $result;

        $data->transform(function ($item) {
            $product = $item->product;
            $customer = $item->customer;
            $salesPerson = $item->salesPerson;

            return [
                'id' => $item->id,
                'order_id' => $item->order_id,
                'order_date' => $item->order_date,
                'customer_id' => $item->customer_id,
                'product_id' => $item->product_id,
                'currency' => $item->currency,
                'ex_rate' => $item->ex_rate,
                'qty' => $item->qty,
                'price' => $item->price,
                'base_total' => $item->base_total,
                'item_deposit' => $item->item_deposit,
                'base_item_deposit' => $item->base_item_deposit,
                'e_total_sales' => $item->e_total_sales,
                'e_total_sales_currency' => $item->e_total_sales_currency,
                'e_profit' => $item->e_profit,
                'e_profit_currency' => $item->e_profit_currency,
                'e_cost_total' => $item->e_cost_total,
                'e_cost_total_currency' => $item->e_cost_total_currency,
                'pod' => $item->pod,
                'rwarehouse' => $item->rwarehouse,
                'order_status' => $item->order_status,
                'customer_code' => $customer->customer_code ?? '',
                'account_name_en' => $customer->account_name_en ?? '',
                'account_name_cn' => empty($customer->account_name_cn) ? $customer->account_name_en : $customer->account_name_cn,
                'product_code' => $product->product_code ?? '',
                'product_title_en' => $product->product_title_en ?? '',
                'product_title_cn' => $product->product_title_cn ?? '',
                'total' => $item->qty * $item->price,
                'deposit' => $item->item_deposit,
                'base_deposit' => $item->base_item_deposit,
                'sales_person_name' => optional($item->customer->salesPerson)->full_name,
            ];
        });

        // Footer sums
        $footer = [
            'total_qty' => $data->sum('qty'),
            'total_subtotal' => $data->sum(fn($i) => $i['qty'] * $i['price']),
            'total_base_total' => $data->sum('base_total'),
            'total_e_cost_total' => $data->sum('e_cost_total'),
            'total_e_profit' => $data->sum('e_profit'),
            'total_item_deposit' => $data->sum('item_deposit'),
        ];

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => [
                'current_page' => $result instanceof LengthAwarePaginator ? $result->currentPage() : 1,
                'data' => $data,
                'footer' => $footer,
                'footer2' => $footer2,
                'last_page' => $result instanceof LengthAwarePaginator ? $result->lastPage() : 1,
                'per_page' => $result instanceof LengthAwarePaginator ? $result->perPage() : $data->count(),
                'total' => $result instanceof LengthAwarePaginator ? $result->total() : $data->count(),
            ]
        ]);
    }
    private function calculateCustomerOrderFooter($query){
        // Remove orderBy and pagination before running aggregates
        $cleanQuery = clone $query;
        $cleanQuery->getQuery()->orders = null;

        $aggregates = $cleanQuery->selectRaw('
            SUM(qty) as total_qty,
            SUM(price * qty) as total_subtotal,
            SUM(base_total) as total_base_total,
            SUM(e_cost_total) as total_e_cost_total,
            SUM(e_profit) as total_e_profit,
            SUM(item_deposit) as total_item_deposit
        ')->first();

        return [
            'total_qty' => (float) ($aggregates->total_qty ?? 0),
            'total_subtotal' => (float) ($aggregates->total_subtotal ?? 0),
            'total_base_total' => (float) ($aggregates->total_base_total ?? 0),
            'total_e_cost_total' => (float) ($aggregates->total_e_cost_total ?? 0),
            'total_e_profit' => (float) ($aggregates->total_e_profit ?? 0),
            'total_item_deposit' => (float) ($aggregates->total_item_deposit ?? 0),
        ];
    }
    public function getCustomerInvoices($customeId,Request $request){
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search', '');

        $query = Invoice_master::with(['customer','invoiceStatus', 'invoiceDetails.product', 'invoiceDetails.productService'])
            ->where('customer_id',$customeId)
            ->whereIn('invoice_status_id', [2, 3])
            ->orderBy('id', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_no', 'like', "%{$search}%")
                    ->orWhereHas('invoiceDetails.product', function ($q2) use ($search) {
                        $q2->where('product_code', 'like', "%{$search}%")
                        ->orWhere('product_title_en', 'like', "%{$search}%")
                        ->orWhere('product_title_cn', 'like', "%{$search}%");
                    })
                    ->orWhereHas('invoiceDetails.productService', function ($q2) use ($search) {
                        $q2->where('service_code', 'like', "%{$search}%")
                        ->orWhere('description_en', 'like', "%{$search}%")
                        ->orWhere('description_cn', 'like', "%{$search}%");
                    });
            });
        }

        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Transform results to include full name and country names
        $transform = function ($list) {
            $list->customer_code = optional($list->customer)->customer_code;
            $list->invoice_status_en = optional($list->invoiceStatus)->status_value_en;
            $list->invoice_status_cn = optional($list->invoiceStatus)->status_value_cn;
            return $list;
        };

        $data = $perPage === -1
            ? $result->map($transform)
            : tap($result)->getCollection()->transform($transform);

        $totals = [
            'total_deposit' => $data->sum('total_deposit'),
            'total' => $data->sum('total'),
            'total_to_pay' => $data->sum('total_to_pay'),
            'base_total' => $data->sum('base_total'),
            'base_total_to_pay' => $data->sum('base_total_to_pay'),
        ];

        $response = [
            'success' => true,
            'message' => 'success',
            'list' => [
                'current_page' => $result instanceof LengthAwarePaginator ? $result->currentPage() : 1,
                'data' => $data,
                'footer' => $totals,  // Include the totals inside the list
                'last_page' => $result instanceof LengthAwarePaginator ? $result->lastPage() : 1,
                'per_page' => $result instanceof LengthAwarePaginator ? $result->perPage() : $data->count(),
                'total' => $result instanceof LengthAwarePaginator ? $result->total() : $data->count(),
            ]
        ];
        return response()->json($response);
    }
    public function getCustomerSalesOrder($customeId,Request $request){
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search', '');

        $query = Sales_order_master::with(['customer','invoiceStatus'])
            ->where('customer_id',$customeId)
            ->where('invoice_status_id',2)
            ->orderBy('id', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('so_number', 'like', "%{$search}%")
                    ->orWhereHas('salesOrderDetails.productItem', function ($q2) use ($search) {
                        $q2->where('product_code', 'like', "%{$search}%")
                            ->orWhere('product_title_en', 'like', "%{$search}%")
                            ->orWhere('product_title_cn', 'like', "%{$search}%");
                    })
                    ->orWhereHas('salesOrderDetails.productService', function ($q2) use ($search) {
                        $q2->where('service_code', 'like', "%{$search}%")
                            ->orWhere('description_en', 'like', "%{$search}%")
                            ->orWhere('description_cn', 'like', "%{$search}%");
                    });
            });
        }

        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Transform results to include full name and country names
        $transform = function ($list) {
            $list->customer_code = optional($list->customer)->customer_code;
            $list->invoice_status_en = optional($list->invoiceStatus)->status_value_en;
            $list->invoice_status_cn = optional($list->invoiceStatus)->status_value_cn;
            return $list;
        };

        $data = $perPage === -1
            ? $result->map($transform)
            : tap($result)->getCollection()->transform($transform);

        $totals = [
            'total_deposit' => $data->sum('total_deposit'),
            'total' => $data->sum('total'),
            'total_to_pay' => $data->sum('total_to_pay'),
            'base_total' => $data->sum('base_total'),
            'base_total_to_pay' => $data->sum('base_total_to_pay'),
        ];

        $response = [
            'success' => true,
            'message' => 'success',
            'list' => [
                'current_page' => $result instanceof LengthAwarePaginator ? $result->currentPage() : 1,
                'data' => $data,
                'footer' => $totals,  // Include the totals inside the list
                'last_page' => $result instanceof LengthAwarePaginator ? $result->lastPage() : 1,
                'per_page' => $result instanceof LengthAwarePaginator ? $result->perPage() : $data->count(),
                'total' => $result instanceof LengthAwarePaginator ? $result->total() : $data->count(),
            ]
        ];
        return response()->json($response);
    }
    public function getCustomerDeposit($customerId, Request $request){
        $perPage = (int) $request->input('per_page', 10);
        $search = strtolower($request->input('search', ''));

        // RVs with product info
        $rvCollection = Receive_voucher_master::with([
            'invoiceStatus',
            'bankAccount',
            'rvDetails.order.product'
        ])
        ->where('account_code', 21301)
        ->where('customer_id', $customerId)
        ->get()
        ->map(function ($rv) {
            return [
                'id'               => $rv->id,
                'rv_date'          => $rv->rv_date,
                'rv_number'        => $rv->rv_number,
                'bank'             => $rv->bank,
                'amount_paid'      => $rv->amount_paid,
                'base_amount_paid' => $rv->base_amount_paid,
                'ex_rate'          => $rv->ex_rate,
                'currency'         => $rv->currency,
                'type'             => 'RV',
                'status_en'        => optional($rv->invoiceStatus)->status_value_en,
                'status_cn'        => optional($rv->invoiceStatus)->status_value_cn,
                'bank_name_en'     => optional($rv->bankAccount)->account_name_en,
                'bank_name_cn'     => optional($rv->bankAccount)->account_name_cn,
                'products'         => $rv->rvDetails
                    ->map(fn($d) => optional(optional($d->order)->product))
                    ->filter()
                    ->values(),
                'source'           => 'rv_master',
            ];
        });

        // JV Entries
        $jvCollection = Account_customer_cn::with(['paymentOrders.order.product'])
            ->where('customer_id', $customerId)
            ->where('ref_data', 'LIKE', '%JV%')
            ->whereNotNull('invoice_id')
            ->get()
            ->filter(fn($cn) => $cn->paymentOrders->isNotEmpty())
            ->map(function ($cn) {

            $products = $cn->paymentOrders
                ->map(fn($po) => optional(optional($po->order)->product))
                ->filter()
                ->values();

                return [
                    'id'               => $cn->id,
                    'rv_date'          => $cn->transaction_date,
                    'rv_number'        => $cn->ref_data,
                    'bank'             => '',
                    'amount_paid'      => $cn->amount,
                    'base_amount_paid' => $cn->base_amount,
                    'ex_rate'          => $cn->ex_rate,
                    'currency'         => $cn->currency,
                    'type'             => 'JV',
                    'status_en'        => 'PAID',
                    'status_cn'        => '已支付',
                    'bank_name_en'     => '',
                    'bank_name_cn'     => '',
                    'products'         => $products,
                    'source'           => 'account_customer_cn',
                ];
            });

        // Merge, filter, sort
        $merged = $rvCollection->merge($jvCollection)
            ->filter(function ($item) use ($search) {
                if (!$search) return true;

                $baseFields = collect([
                    $item['rv_number'],
                    $item['bank'],
                    $item['currency'],
                    $item['status_en'],
                    $item['status_cn'],
                ])->map(fn($v) => strtolower((string) $v));

                $productMatches = collect($item['products'])->filter(function ($product) use ($search) {
                    return str_contains(strtolower(optional($product)->product_code ?? ''), $search)
                        || str_contains(strtolower(optional($product)->product_title_en ?? ''), $search)
                        || str_contains(strtolower(optional($product)->product_title_cn ?? ''), $search);
                });

                return $baseFields->contains(fn($v) => str_contains($v, $search)) || $productMatches->isNotEmpty();
            })
            ->sortByDesc(function ($item) {
                // Convert "Mar 10 2025" format to sortable date
                try {
                    return \Carbon\Carbon::createFromFormat('M d Y', $item['rv_date'])->timestamp;
                } catch (\Exception $e) {
                    return 0; // fallback for invalid dates
                }
            })
            ->values(); // ensure 0-based indexing

        // No pagination case
        if ($perPage === -1) {
            return response()->json([
                'success' => true,
                'message' => 'success',
                'list' => [
                    'current_page' => 1,
                    'data'         => $merged,
                    'last_page'    => 1,
                    'per_page'     => $merged->count(),
                    'total'        => $merged->count(),
                ],
            ]);
        }

        // Pagination logic
        $page = LengthAwarePaginator::resolveCurrentPage();
        $paginator = new LengthAwarePaginator(
            $merged->slice(($page - 1) * $perPage, $perPage)->values(), // 👈 values() resets keys
            $merged->count(),
            $perPage,
            $page,
            ['path' => LengthAwarePaginator::resolveCurrentPath()]
        );

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list'    => $paginator,
        ]);
    }
    public function getCustomerProfitability($customeId,Request $request){
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search', '');

        $query = Invoice_master::with(['customer','invoiceStatus', 'invoiceDetails.product', 'invoiceDetails.productService'])
            ->where('customer_id',$customeId)
            ->orderBy('id', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_no', 'like', "%{$search}%")
                    ->orWhereHas('invoiceDetails.product', function ($q2) use ($search) {
                        $q2->where('product_code', 'like', "%{$search}%")
                        ->orWhere('product_title_en', 'like', "%{$search}%")
                        ->orWhere('product_title_cn', 'like', "%{$search}%");
                    })
                    ->orWhereHas('invoiceDetails.productService', function ($q2) use ($search) {
                        $q2->where('service_code', 'like', "%{$search}%")
                        ->orWhere('description_en', 'like', "%{$search}%")
                        ->orWhere('description_cn', 'like', "%{$search}%");
                    });
            });
        }

        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Transform results to include full name and country names
        $transform = function ($list) {
            $list->customer_code = optional($list->customer)->customer_code;
            $list->invoice_status_en = optional($list->invoiceStatus)->status_value_en;
            $list->invoice_status_cn = optional($list->invoiceStatus)->status_value_cn;
            return $list;
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
    public function getCustomerOrderHistory($customeId,Request $request)
    {
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search', '');

        $query = Invoice_master::with(['customer','invoiceStatus', 'invoiceDetails.product', 'invoiceDetails.productService'])
            ->where('customer_id',$customeId)
            ->whereIn('invoice_status_id', [1])
            ->orderBy('id', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_no', 'like', "%{$search}%")
                    ->orWhereHas('invoiceDetails.product', function ($q2) use ($search) {
                        $q2->where('product_code', 'like', "%{$search}%")
                        ->orWhere('product_title_en', 'like', "%{$search}%")
                        ->orWhere('product_title_cn', 'like', "%{$search}%");
                    })
                    ->orWhereHas('invoiceDetails.productService', function ($q2) use ($search) {
                        $q2->where('service_code', 'like', "%{$search}%")
                        ->orWhere('description_en', 'like', "%{$search}%")
                        ->orWhere('description_cn', 'like', "%{$search}%");
                    });
            });
        }

        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Transform results to include full name and country names
        $transform = function ($list) {
            $list->customer_code = optional($list->customer)->customer_code;
            $list->invoice_status_en = optional($list->invoiceStatus)->status_value_en;
            $list->invoice_status_cn = optional($list->invoiceStatus)->status_value_cn;
            return $list;
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
    public function getCustomerCredit_old($customerId, Request $request){
        $perPage = (int) $request->input('per_page', 10);
        $search = strtolower($request->input('search', ''));

        $query = Customer_credit::query()
            ->where('customer_id', $customerId)
            ->where(function ($q) {
                $q->where('debit', '>', 0)
                ->orWhere('credit', '>', 0);
            })
            ->orderByRaw("DATE_FORMAT(STR_TO_DATE(transaction_date, '%M %d %Y'), '%Y%m%d') DESC")
            ->orderByDesc('updated_at')
            ->orderBy('id', 'asc');

        // Get all filtered data first if perPage = -1 (no pagination)
        // Otherwise paginate first, then filter by product search on the paginated data.
        if ($perPage === -1) {
            $result = $query->get();
        } else {
            $result = $query->paginate($perPage);
        }

        // Function to check if product matches search based on type and ref_data
        $productMatchesSearch = function ($type, $ref_data, $search) {
            $search = strtolower($search);
            if (!$search) {
                return true; // No search filter, accept all
            }

            switch (strtoupper($type)) {
                case 'CR':
                    $details = Credit_note_customer_detail::with(['account', 'product'])
                        ->where('cr_number', $ref_data)
                        ->get();
                    break;

                case 'RV':
                    $details = Receive_voucher_detail::with('order.product', 'account', 'invoice')
                        ->where('rv_number', $ref_data)
                        ->get();
                    break;

                case 'INV':
                case 'AR':
                    $details = Invoice_detail::with(['product', 'productService'])
                        ->where('invoice_no', $ref_data)
                        ->get();
                    break;

                case 'ORDER':
                    $refArray = explode(',', $ref_data);
                    $details = Account_customer_cn::with(['paymentOrders.order.product'])
                        ->whereIn('ref_data', $refArray)
                        ->get();
                    break;

                default:
                    return false;
            }

            foreach ($details as $detail) {
                // Depending on type, product might be nested differently
                $products = collect();

                if (in_array(strtoupper($type), ['CR'])) {
                    if ($detail->product) {
                        $products->push($detail->product);
                    }
                } elseif (in_array(strtoupper($type), ['RV'])) {
                    if ($detail->order && $detail->order->product) {
                        $products->push($detail->order->product);
                    }
                } elseif (in_array(strtoupper($type), ['INV', 'AR'])) {
                    if ($detail->product) {
                        $products->push($detail->product);
                    }
                    if ($detail->productService) {
                        $products->push($detail->productService);
                    }
                } elseif (strtoupper($type) === 'ORDER') {
                    foreach ($detail->paymentOrders as $paymentOrder) {
                        if ($paymentOrder->order && $paymentOrder->order->product) {
                            $products->push($paymentOrder->order->product);
                        }
                    }
                }

                foreach ($products as $product) {
                    if (!$product) continue;

                    if (str_contains(strtolower($product->product_code ?? ''), $search)
                        || str_contains(strtolower($product->product_title_en ?? ''), $search)
                        || str_contains(strtolower($product->product_title_cn ?? ''), $search)
                    ) {
                        return true;
                    }
                }
            }

            return false;
        };

        // Filter collection by product search
        if ($perPage === -1) {
            $filtered = $result->filter(function ($credit) use ($search, $productMatchesSearch) {
                return $productMatchesSearch($credit->type, $credit->ref_data, $search);
            })->values();
        } else {
            // For paginated data, filter collection inside paginator
            $result->getCollection()->transform(function ($credit) use ($search, $productMatchesSearch) {
                return $credit;
            });
            $filteredCollection = $result->getCollection()->filter(function ($credit) use ($search, $productMatchesSearch) {
                return $productMatchesSearch($credit->type, $credit->ref_data, $search);
            })->values();

            // Replace paginator's collection with filtered collection
            $result->setCollection($filteredCollection);
            $filtered = $result;
        }

        // Transform results to include customer_code
        $transform = function ($item) {
            $item->customer_code = optional($item->customer)->customer_code;
            return $item;
        };

        if ($perPage === -1) {
            $data = $filtered->map($transform);
            return response()->json([
                'success' => true,
                'message' => 'success',
                'list' => [
                    'current_page' => 1,
                    'data' => $data,
                    'last_page' => 1,
                    'per_page' => $data->count(),
                    'total' => $data->count(),
                ]
            ]);
        } else {
            $result->getCollection()->transform($transform);
            return response()->json([
                'success' => true,
                'message' => 'success',
                'list' => $result,
            ]);
        }
    }
    public function getCustomerCredit($customerId, Request $request){
        $perPage = (int) $request->input('per_page', 10);
        $search = strtolower($request->input('search', ''));
        // 1. Fetch and map Account_customer_cn

        $currency = Customer::where('id',$customerId)->value('currency');

        $cnRecords = Account_customer_cn::where('customer_id', $customerId)
            ->with(['creditNoteDetails', 'customer'])
            ->get()
            ->map(function ($item) use ($currency) {
                $type = 'ORDER';
                if (strlen($item->cr_detail_id) > 0) $type = 'CR';
                elseif (strlen($item->rv_detail_id) > 0) $type = 'RV';
                elseif (strlen($item->invoice_id) > 0) $type = 'INV';
                $isRefund = $item->creditNoteDetails
                    ->pluck('account_code')
                    ->unique()
                    ->implode(',');
                $table_id = '';
                $rv_number = '';
                $cr_no = '';
                $invoice_no = '';
                $order_id = '';
                if ($type === "ORDER") {
                    $table_id = Payment_orders_cn::where('account_customer_cn_id', $item->id)->pluck('order_id')->implode(',');
                    $order_id = $table_id;
                }
                if ($type === "RV") {
                    $rv_number = $item->ref_data;
                    $table_id = $rv_number;
                }
                if ($type === "CR") {
                    $cr_no = $item->ref_data;
                    $table_id = $cr_no;
                }
                if ($type === "INV") {
                    $invoice_no = $item->ref_data;
                    $table_id = $invoice_no;
                }

                $debit = ($item->currency === $currency ? $item->debit : $item->debit * $item->ex_rate);
                $credit = ($item->currency === $currency ? $item->credit : $item->credit * $item->ex_rate);

                return (object)[
                    'id' => $item->id,
                    'customer_id' => $item->customer_id,
                    'currency' => $currency,
                    'ex_rate' => $item->ex_rate,
                    'debit' => $debit,
                    'credit' => $credit,
                    'base_debit' => $debit * $item->ex_rate,
                    'base_credit' => $credit * $item->ex_rate,
                    'transaction_date' => $item->transaction_date,
                    'ref_data' => $item->ref_data ?? '',
                    'cr_no' => $cr_no,
                    'rv_number' => $rv_number,
                    'invoice_no' => $invoice_no ?? '',
                    'table_id' => $table_id,
                    'type' => $type,
                    'is_refund' => $isRefund,
                    'particulars' => $item->particulars,
                    'orders_id' => $order_id,
                    'ref_id' => $item->id,
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
                    'customer' => $item->customer ?? null,
                ];
            });
        // 2. Fetch and map Accounts_receivable
        $arRecords = Accounts_receivable::where('customer_id', $customerId)
            ->with('customer')
            ->where('balance', '>', 0)
            ->get()
            ->map(function ($item) use ($currency) {
                $balance = ($item->currency === $currency ? $item->balance : $item->balance * $item->ex_rate);
                return (object)[
                    'id' => $item->id,
                    'customer_id' => $item->customer_id,
                    'currency' => $item->currency,
                    'ex_rate' => $item->ex_rate,
                    'debit' => $balance,
                    'credit' => 0.00,
                    'base_debit' => $balance * $item->ex_rate,
                    'base_credit' => 0,
                    'transaction_date' => $item->transaction_date,
                    'ref_data' => $item->invoice_no,
                    'cr_no' => '',
                    'rv_number' => '',
                    'invoice_no' => $item->invoice_no,
                    'table_id' => $item->invoice_no,
                    'type' => 'AR',
                    'is_refund' => 0,
                    'particulars' => $item->account_description,
                    'orders_id' => '',
                    'ref_id' => $item->id,
                    'created_at' => $item->created_at,
                    'updated_at' => $item->updated_at,
                    'customer' => $item->customer ?? null,
                ];
            });
        // 3. Merge both collections
        $combined = $cnRecords->merge($arRecords);
        // 4. Group records by currency
        $groupedByCurrency = $combined->groupBy('currency');
        // 5. For each currency, calculate the running balance and total balance (credits - debits)
        $groupedWithBalance = $groupedByCurrency->map(function ($items, $currency) {
            // Sort by transaction_date ASC, updated_at ASC, id ASC (oldest first for balance calculation)
            $sortedAsc = $items->sort(function ($a, $b) {
                $dateA = Carbon::parse($a->transaction_date);
                $dateB = Carbon::parse($b->transaction_date);
                if ($dateA->eq($dateB)) {
                    if ($a->updated_at == $b->updated_at) {
                        return $a->id <=> $b->id;
                    }
                    return $a->updated_at <=> $b->updated_at;
                }
                return $dateA <=> $dateB;
            })->values();
            // Calculate running balance and total credit and debit
            $runningBalance = 0;
            $totalDebit = 0;
            $totalCredit = 0;
            $itemsWithBalance = $sortedAsc->map(function ($item) use (&$runningBalance, &$totalDebit, &$totalCredit) {
                $runningBalance += ($item->credit - $item->debit);
                $totalDebit += $item->debit;
                $totalCredit += $item->credit;
                $item->running_balance = $runningBalance;
                return $item;
            });
            // Return items with their balance and total

            $total_balance = number_format($totalCredit - $totalDebit, 2, '.', '');

            return [
                'currency' => $currency,
                'items' => $itemsWithBalance,
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'total_balance' => $total_balance,
            ];
        });
        // Flatten back into a single collection of items
        $withBalance = $groupedWithBalance->pluck('items')->flatten();
        // 6. Sort by transaction_date DESC, updated_at DESC, id ASC (newest first for display)
        $sortedDesc = $withBalance->sort(function ($a, $b) {
            $dateA = Carbon::parse($a->transaction_date);
            $dateB = Carbon::parse($b->transaction_date);
            if ($dateA->eq($dateB)) {
                if ($a->updated_at == $b->updated_at) {
                    return $a->id <=> $b->id;
                }
                return $b->updated_at <=> $a->updated_at;
            }
            return $dateB <=> $dateA;
        })->values();
        // 7. Function to check product match (copy from old)
        $productMatchesSearch = function ($type, $ref_data, $search) {
            if (!$search) return true;
            switch (strtoupper($type)) {
                case 'CR':
                    $details = Credit_note_customer_detail::with(['account', 'product'])
                        ->where('cr_number', $ref_data)->get();
                    break;
                case 'RV':
                    $details = Receive_voucher_detail::with('order.product', 'account', 'invoice')
                        ->where('rv_number', $ref_data)->get();
                    break;
                case 'INV':
                case 'AR':
                    $details = Invoice_detail::with(['product', 'productService'])
                        ->where('invoice_no', $ref_data)->get();
                    break;
                case 'ORDER':
                    $refArray = explode(',', $ref_data);
                    $details = Account_customer_cn::with(['paymentOrders.order.product'])
                        ->whereIn('ref_data', $refArray)->get();
                    break;
                default:
                    return false;
            }
            foreach ($details as $detail) {
                $products = collect();
                if (in_array(strtoupper($type), ['CR'])) {
                    if ($detail->product) $products->push($detail->product);
                } elseif (in_array(strtoupper($type), ['RV'])) {
                    if ($detail->order && $detail->order->product) $products->push($detail->order->product);
                } elseif (in_array(strtoupper($type), ['INV', 'AR'])) {
                    if ($detail->product) $products->push($detail->product);
                    if ($detail->productService) $products->push($detail->productService);
                } elseif (strtoupper($type) === 'ORDER') {
                    foreach ($detail->paymentOrders as $paymentOrder) {
                        if ($paymentOrder->order && $paymentOrder->order->product) {
                            $products->push($paymentOrder->order->product);
                        }
                    }
                }
                foreach ($products as $product) {
                    if (!$product) continue;
                    if (
                        str_contains(strtolower($product->product_code ?? ''), $search) ||
                        str_contains(strtolower($product->product_title_en ?? ''), $search) ||
                        str_contains(strtolower($product->product_title_cn ?? ''), $search)
                    ) {
                        return true;
                    }
                }
            }
            return false;
        };
        
        // Prepare credit balance totals by currency as an array of objects
        $creditBalanceTotals = $groupedWithBalance->map(function ($group) {
            return [
                'currency' => $group['currency'],
                'balance' => $group['total_balance']
            ];
        })->values(); // Convert to array without keys
        
        // Handle pagination and response
        if ($perPage === -1) {
            // Filter entire collection
            $filtered = $sortedDesc->filter(fn($item) => $productMatchesSearch($item->type, $item->ref_data, $search))->values();
            $filtered = $filtered->map(fn($item) => tap($item, fn($i) => $i->customer_code = optional($i->customer)->customer_code ?? null));
            
            return response()->json([
                'success' => true,
                'message' => 'success',
                'list' => [
                    'current_page' => 1,
                    'data' => $filtered,
                    'last_page' => 1,
                    'per_page' => $filtered->count(),
                    'total' => $filtered->count(),
                    'creditBalance' => $creditBalanceTotals,
                ],
            ]);
        } else {
            // Paginate filtered results
            $currentPage = max(1, (int)$request->input('page', 1));
            $total = $sortedDesc->count();
            $pageItems = $sortedDesc->slice(($currentPage - 1) * $perPage, $perPage)->values();
            $filteredPageItems = $pageItems->filter(fn($item) => $productMatchesSearch($item->type, $item->ref_data, $search))->values();
            $filteredPageItems = $filteredPageItems->map(fn($item) => tap($item, fn($i) => $i->customer_code = optional($i->customer)->customer_code ?? null));
            
            // Create paginator instance to mimic old behavior
            $paginator = new LengthAwarePaginator(
                $filteredPageItems,
                $total,
                $perPage,
                $currentPage,
                ['path' => LengthAwarePaginator::resolveCurrentPath()]
            );
            
            // Convert paginator to array and add credit balance totals
            $paginatorArray = $paginator->toArray();
            $paginatorArray['creditBalance'] = $creditBalanceTotals;
            
            return response()->json([
                'success' => true,
                'message' => 'success',
                'list' => $paginatorArray,
            ]);
        }
    }
    public function getCustomerRefund($customeId,Request $request){
        $perPage = (int) $request->input('per_page', 10);
        $search = $request->input('search', '');

        $query = Payment_voucher_master::with(['chartOfAccount'])
            ->where('customer_id',$customeId)
            ->where('payment_type_id',3)
            ->orderBy('id', 'desc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('ref_data', 'like', "%{$search}%")
                    ->orWhere('pv_date', 'like', "%{$search}%");
            });
        }

        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Transform results to include full name and country names
        $transform = function ($list) {
            $list->bank_name_en = optional($list->chartOfAccount)->account_name_en;
            $list->bank_name_cn = optional($list->chartOfAccount)->account_name_cn;
            return $list;
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
    public function delCustomer(Request $request){
        $ids = $request->input('ids');
        $type = $request->input('type');

        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'No Customer IDs provided'], 400);
        }

        foreach ($ids as $id) {
            $customer = Customer::find($id);
            if (!$customer) continue;

            if ($type === 'soft') {

                $globalController = new GlobalController();
                $globalController->logAction(
                    'Customer', 'm_customer',
                    'delete',
                    'Customer Code : ' . $customer->customer_code
                );
                $customer->is_deleted = 1;
                $customer->save();
            } elseif ($type === 'hard') {

                $globalController = new GlobalController();
                $globalController->logAction(
                    'Customer Archive', 'm_customer',
                    'delete',
                    'Customer Code : ' . $customer->customer_code
                );

                $customer->delete();
            } else {
                return response()->json(['message' => 'Invalid delete type'], 400);
            }
        }

        event(new CustomerEvent( 'delete'));
        event(new LogEvent( 'insert'));

        return response()->json(['message' => 'Customer deleted']);
    }
    public function getCustomerInfo($id)
    {
        $customer = Customer::with(['customer_group'])
            ->where('id', $id)
            ->where('is_deleted', 0)
            ->first();

        // ✅ Stop early if no product found
        if (!$customer) {
            return response()->json([
                'success' => true,
                'message' => 'Customer is empty',
                'product' => [
                    'groups' => [],
                ],
            ]);
        }

        // Map customer_group with 'en' and 'cn'
        $mappedCustomerGroups = $customer->customer_group->map(function ($customer_group) {
            return [
                'value' => $customer_group->id,
                'en' => $customer_group->customer_group_en,
                'cn' => $customer_group->customer_group_cn,
            ];
        });

        // Convert product to array and add genres as a separate key
        $customerData = $customer->toArray();
        $customerData['groups'] = $mappedCustomerGroups;

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $customerData,
        ]);
    }
    public function getCustomerEmails($customeId)
    {
        $customerEmail = Customer_email::select('id', 'customer_id', 'email_address', 'set_as_default')
            ->where('customer_id', $customeId)
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($email) {
                return [
                    'id' => $email->id,
                    'customer_id' => $email->customer_id,
                    'email_address' => $email->email_address,
                    'set_as_default' => (bool) $email->set_as_default,
                    'is_deleted' => 0,
                    'indexInt' => $email->id . rand(1, 100), // Add random number between 1 and 100
                ];
            });

        if ($customerEmail->isEmpty()) {
            return response()->json([
                'success' => true, // Return success but with empty data
                'message' => 'No emails',
                'data' => [],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Success',
            'data' => $customerEmail->toArray(),
        ]);
    }
    public function getCustomerGroup($customeId)
    {
        $customerGroup = Customer_group_list::select('id', 'customer_id', 'customer_group_id','set_as_default')
            ->where('customer_id', $customeId)
            ->orderBy('id', 'asc')
            ->get()
            ->map(function ($group) {
                return [
                    'id' => $group->id,
                    'customer_id' => $group->customer_id,
                    'customer_group_id' => $group->customer_group_id,
                    'set_as_default' => (bool) $group->set_as_default,
                    'is_deleted' => 0,
                    'indexInt' => $group->id . rand(1, 100), // Add random number between 1 and 100
                ];
            });

        if ($customerGroup->isEmpty()) {
            return response()->json([
                'success' => true, // Return success but with empty data
                'message' => 'No emails',
                'data' => [],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Success',
            'data' => $customerGroup->toArray(),
        ]);
    }
    public function updateCustomer(Request $request, $id)
    {
        $OrigID = $id;
        $returnId = $id;

        // Instantiate the service
        $brevoService = new BrevoService();

        // If product ID is 0, create a new product
        if ((int) $id === 0) {
            // Prepare product data including status
            $CustomerData = $request->only([
                'customer_code', 
                'old_customer_code',
                'account_name_en', 
                'account_name_cn', 
                'billing_address_en',
                'billing_address_cn', 
                'billing_country', 
                'billing_state_id', 
                'billing_fax_no', 
                'billing_name_en',
                'billing_name_cn', 
                'billing_postal_code', 
                'billing_tel_no',

                'delivery_address_en',
                'delivery_address_cn', 
                'delivery_country', 
                'delivery_state_id', 
                'delivery_fax_no', 
                'delivery_name_en',
                'delivery_name_cn', 
                'delivery_postal_code', 
                'delivery_tel_no',

                'company_en',
                'company_cn',
                'credit_limit',
                'customer_since',
                'customer_type',
                'language',
                'memo',
                'mobile',
                'password',
                'payment_terms_id',
                'pod',
                'price_level',
                'rwarehouse',
                'sales_person_id',
                'shipping_address',
                'shipping_terms_id',
                'status',
                'tax_group',
                'tax_ref_no',
                'tel_no',
                'user_id',
                'webpage_address',
                'is_new_inventory',
                'is_subscribe',
                'is_view_new_order',
            ]);
            // Create product with status
            $customer = Customer::create($CustomerData);
            $id = $customer->id; // update ID for image handling later
            $returnId = $customer->id; // update ID for image handling later
        } else {
            // Otherwise, find existing product
            $customer = Customer::find($id);

            // Prepare update data including the new status
            $updateData = $request->only([
                'customer_code', 
                'old_customer_code',
                'account_name_en', 
                'account_name_cn', 
                'billing_address_en',
                'billing_address_cn', 
                'billing_country', 
                'billing_state_id', 
                'billing_fax_no', 
                'billing_name_en',
                'billing_name_cn', 
                'billing_postal_code', 
                'billing_tel_no',

                'delivery_address_en',
                'delivery_address_cn', 
                'delivery_country', 
                'delivery_state_id', 
                'delivery_fax_no', 
                'delivery_name_en',
                'delivery_name_cn', 
                'delivery_postal_code', 
                'delivery_tel_no',

                'company_en',
                'company_cn',
                'credit_limit',
                'customer_since',
                'customer_type',
                'language',
                'memo',
                'mobile',
                'password',
                'payment_terms_id',
                'pod',
                'price_level',
                'rwarehouse',
                'sales_person_id',
                'shipping_address',
                'shipping_terms_id',
                'status',
                'tax_group',
                'tax_ref_no',
                'tel_no',
                'user_id',
                'webpage_address',
                'is_new_inventory',
                'is_subscribe',
                'is_view_new_order',
            ]);
            $customer->update($updateData);
            $returnId = $id; // update ID for image handling later
        }
        // Copy PRICING from another product
        if ($request->is_new_customer_id && $request->is_new_customer_id > 0) {
            $originalProductId = $request->is_new_customer_id;
            if ($request->is_copy_group === 'true') {
                $customerGroupList = Customer_group_list::where('customer_id', $originalProductId)
                    ->get();

                foreach ($customerGroupList as $group) {
                    Customer_group_list::create([
                        'customer_id'       => $id,
                        'customer_group_id' => $group->customer_group_id,
                        'set_as_default'     => $group->set_as_default,
                    ]);
                }
            }

        }
        $email_address = "";
        $count_email = 0;
        // Sync emails if provided
        if ($request->has('emails')) {
            foreach ($request->emails as $emailData) {
                if (is_string($emailData)) {
                    $emailData = json_decode($emailData, true);
                }

                // Handle deleted emails
                if (isset($emailData['is_deleted']) && $emailData['is_deleted'] == 1 && isset($emailData['id']) && $emailData['id'] != 0) {
                    $brevoService->removeContact($emailData['email_address']);
                    Customer_email::where('id', $emailData['id'])->delete();
                    continue;
                }

                if (isset($emailData['id']) && $emailData['id'] == 0) {
                    Customer_email::create([
                        'customer_id' => $emailData['customer_id'],
                        'email_address' => $emailData['email_address'],
                        'set_as_default' => $emailData['set_as_default'] ?? false,
                    ]);
                } else {
                    if($emailData['is_deleted'] !== 1){
                        Customer_email::where('id', $emailData['id'])->update([
                            'customer_id' => $emailData['customer_id'],
                            'email_address' => $emailData['email_address'],
                            'set_as_default' => $emailData['set_as_default'] ?? false,
                        ]);
                    }
                }
                $count_email++;
                if($emailData['set_as_default']){
                    $email_address = $emailData['email_address'];
                }
            }
        }
        if($count_email === 1){
            $customerExists = Customer::where('id',$returnId)->first();
            $customerExists->email_address = $email_address;
            $customerExists->save();
        }
        $countGroups = 0;
        $groupIds = 0;
        // Sync groups
        if ($request->has('groups')) {
            foreach ($request->groups as $groupData) {
                if (is_string($groupData)) {
                    $groupData = json_decode($groupData, true);
                }

                if (!is_array($groupData)) continue;

                if (isset($groupData['is_deleted']) && $groupData['is_deleted'] == 1 && isset($groupData['id']) && $groupData['id'] != 0) {
                    // Get the customer_group_id from the record before deleting
                    $groupRecord = Customer_group_list::find($groupData['id']);
                    if ($groupRecord) {
                        // Get Brevo list ID of the group
                        $brevoListId = Customer_group::where('id', $groupRecord->customer_group_id)->value('brevo_list_id');

                        if ($brevoListId) {
                            // Get the email address for that customer
                            $customerEmail = Customer_email::where('customer_id', $groupRecord->customer_id)->value('email_address');

                            if ($customerEmail) {
                                // Call function to remove email from Brevo list
                                $brevoService->unlinkContactFromList($customerEmail, $brevoListId);
                            }
                        }
                    }

                    Customer_group_list::where('id', $groupData['id'])->delete();
                    continue;
                }

                if (isset($groupData['id']) && $groupData['id'] == 0) {
                    Customer_group_list::create([
                        'customer_id' => $groupData['customer_id'],
                        'customer_group_id' => $groupData['customer_group_id'],
                        'set_as_default' => $groupData['set_as_default'] ?? false,
                    ]);
                } else {
                    if($groupData['is_deleted'] !== 1){
                        Customer_group_list::where('id', $groupData['id'])->update([
                            'customer_id' => $groupData['customer_id'],
                            'customer_group_id' => $groupData['customer_group_id'],
                            'set_as_default' => $groupData['set_as_default'] ?? false,
                        ]);
                    }
                }
                $groupIds = $groupData['customer_group_id'];
                $countGroups++;
            }
        }

        if($countGroups === 1){
            $customer = Customer::find($returnId);
            $customerGroup = Customer_group::find($groupIds);
            $customer->update(['currency' => $customerGroup->currency]);
        }
        else{
            $groupList = Customer_group_list::with(['customerGroup'])
                ->where('customer_id', $returnId)
                ->where('set_as_default', 1)
                ->first();
            $customer = Customer::find($returnId);
            $customer->update(['currency' => $groupList->customerGroup->currency]);
        }

        // Now sync to 
        $customer = Customer::find($id);
        if ($customer) {
            $brevoService->addOrUpdateContact($customer->id);
        }
        $Action = ($OrigID === 0 ? 'insert' : 'update');

        $globalController = new GlobalController();
        $globalController->logAction(
            'Customers', 'm_customer',
            $Action,
            'Customer Code : ' . $request->customer_code
        );

        event(new CustomerEvent( $Action));
        event(new LogEvent( 'insert'));

        return response()->json([
            'message' => 'Customer updated successfully',
            'token'   => 'Success',
            'id'      => $id,
            'action'  => $Action
        ]);
    }
    public function getCustomerExists($customerCode){
        return Customer::where('customer_code', $customerCode)->count();
    }
    public function deleteCustomers(Request $request){
        $ids = $request->input('ids');
        $type = $request->input('type');

        if (!is_array($ids) || empty($ids)) {
            return response()->json(['message' => 'No Customers IDs provided'], 400);
        }

        foreach ($ids as $id) {
            $customer = customer::find($id);
            if (!$customer) continue;

            if ($type === 'soft') {

                $globalController = new GlobalController();
                $globalController->logAction(
                    'Customer', 'm_customer',
                    'delete',
                    'Customer Code : ' . $customer->customer_code
                );
                $customer->is_deleted = 1;
                $customer->save();
            } elseif ($type === 'hard') {

                $globalController = new GlobalController();
                $globalController->logAction(
                    'Customer', 'm_customer',
                    'delete',
                    'Customer Code : ' . $customer->customer_code
                );

                $customer->delete();
            } else {
                return response()->json(['message' => 'Invalid delete type'], 400);
            }
        }

        event(new CustomerEvent( 'delete'));
        event(new LogEvent( 'insert'));

        return response()->json(['message' => 'Customer deleted']);
    }
    public function getOrderDetails($orderID){
        // Get account_customer_cn IDs related to the order via payment_orders_cn
        $accountCustomerCnIds = Payment_orders_cn::where('order_id', $orderID)->pluck('account_customer_cn_id');

        // Fetch account_customer_cn records by those IDs, eager load paymentOrders for completeness
        $accountResults = Account_customer_cn::whereIn('id', $accountCustomerCnIds)
            ->with(['paymentOrders' => function($query) use ($orderID) {
                $query->where('order_id', $orderID);
            }])
            ->get()
            ->map(function ($item) {
                return [
                    'ref_data' => $item->ref_data,
                    'transaction_date' => $item->transaction_date,
                    'orders_id' => $item->orders_id,
                    'payment_order' => $item->paymentOrders->first() ? $item->paymentOrders->first()->payment_order : null,
                ];
            });

        // Query receive_voucher_detail
        $rvResults = Receive_voucher_detail::select([
                'rv_number as ref_data',
                'rv_date as transaction_date',
                'order_id as orders_id',
                'amount as payment_order'
            ])
            ->where('order_id', $orderID)
            ->get();

        // Merge results
        $customerData = $accountResults->concat($rvResults)->values();

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $customerData,
        ]);
    }

    public function getInvoiceDetails($invoiceNo){
        $customerData = Invoice_detail::with(['product' => function ($query) {
                $query->select('id','product_code', 'product_title_en', 'product_title_cn', 'item_cost');
            }])
            ->where('invoice_no', $invoiceNo)
            ->orderBy('id', 'ASC')
            ->get()
            ->map(function ($item) {
                $item_cost = $item->product->item_cost ?? null;

                $item->profitability = $item_cost !== null
                    ? round(($item->base_total - ($item->qty * $item_cost)), 2)
                    : $item->total;

                // Add product info directly for clarity in the response
                $item->product_code = $item->product->product_code ?? null;
                $item->product_title_en = $item->product->product_title_en ?? null;
                $item->product_title_cn = $item->product->product_title_cn ?? null;

                return $item;
            });

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $customerData,
        ]);
    }
    public function getSODetails($SONumber){
        // Query from so_detail table
        $soDetails = Sales_order_detail::with(['productItem', 'productService'])
            ->where('so_number', $SONumber)
            ->get()
            ->map(function ($soDetail) {
                // Check if product_id is null, then choose product or service
                if ($soDetail->product_id) {
                    // Display product details if product_id is not null
                    $productTitle = $soDetail->productItem->product_title_en ?? $soDetail->productService->description_en;
                    $productTitleCN = $soDetail->productItem->product_title_cn ?? $soDetail->productService->description_cn;

                    return [
                        'id' => $soDetail->id,
                        'product_code' => $soDetail->productItem->product_code ?? null,
                        'product_title_en' => $productTitle,
                        'product_title_cn' => $productTitleCN,
                        'currency' => $soDetail->currency,
                        'deposit' => $soDetail->deposit,
                        'qty' => $soDetail->qty,
                        'price' => $soDetail->price,
                        'total' => $soDetail->total,
                    ];
                } else {
                    // Display service details if product_id is null
                    return [
                        'id' => $soDetail->id,
                        'product_code' => $soDetail->productService->service_code ?? null,
                        'product_title_en' => $soDetail->productService->description_en,
                        'product_title_cn' => $soDetail->productService->description_cn,
                        'currency' => $soDetail->currency,
                        'deposit' => $soDetail->deposit,
                        'qty' => $soDetail->qty,
                        'price' => $soDetail->price,
                        'total' => $soDetail->total,
                    ];
                }
            });

        // Query from so_detail_copy table
        $soDetailCopies = Sales_order_detail_copy::with(['productItem', 'productService'])
            ->where('so_number', $SONumber)
            ->get()
            ->map(function ($soDetailCopy) {
                // Check if product_id is null, then choose product or service
                if ($soDetailCopy->product_id) {
                    // Display product details if product_id is not null
                    $productTitle = $soDetailCopy->productItem->product_title_en ?? $soDetailCopy->productService->description_en;
                    $productTitleCN = $soDetailCopy->productItem->product_title_cn ?? $soDetailCopy->productService->description_cn;

                    return [
                        'id' => $soDetailCopy->id,
                        'product_code' => $soDetailCopy->productItem->product_code ?? null,
                        'product_title_en' => $productTitle,
                        'product_title_cn' => $productTitleCN,
                        'currency' => $soDetailCopy->currency,
                        'deposit' => $soDetailCopy->deposit,
                        'qty' => $soDetailCopy->qty,
                        'price' => $soDetailCopy->price,
                        'total' => $soDetailCopy->total,
                    ];
                } else {
                    // Display service details if product_id is null
                    return [
                        'id' => $soDetailCopy->id,
                        'product_code' => $soDetail->productService->service_code ?? null,
                        'product_title_en' => $soDetailCopy->productService->description_en,
                        'product_title_cn' => $soDetailCopy->productService->description_cn,
                        'currency' => $soDetailCopy->currency,
                        'deposit' => $soDetailCopy->deposit,
                        'qty' => $soDetailCopy->qty,
                        'price' => $soDetailCopy->price,
                        'total' => $soDetailCopy->total,
                    ];
                }
            });

        // Merge both collections (so_details and so_detail_copies)
        $allDetails = $soDetails->merge($soDetailCopies);

        // Sort by ID
        $sortedDetails = $allDetails->sortBy('id');

        // Return response in JSON format
        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $sortedDetails->values(),  // Return the sorted and merged details
        ]);
    }
    public function getDepositDetails($refData, $type){
        switch (strtoupper($type)) {
            case 'JV': // Case 1
                $results = Account_customer_cn::with(['paymentOrders.order.product'])
                    ->where('ref_data', $refData)
                    ->get()
                    ->flatMap(function ($account) {
                        return $account->paymentOrders->map(function ($paymentOrder) use ($account) {
                            $order = $paymentOrder->order;
                            $product = $order?->product;
                            return [
                                'id' => $order->id,
                                'product_id' => $order->product_id,
                                'product_code' => $product?->product_code,
                                'product_title_en' => $product?->product_title_en,
                                'product_title_cn' => $product?->product_title_cn,
                                'currency' => $order?->currency,
                                'qty' => $order?->qty,
                                'item_deposit' => $order?->item_deposit,
                                'base_item_deposit' => $order && $order->ex_rate
                                    ? $order->item_deposit * $order->ex_rate
                                    : null,
                            ];
                        });
                    });
                break;

            case 'RV': // Case 2
                $results = Receive_voucher_detail::with('order.product')
                    ->where('rv_number', $refData)
                    ->get()
                    ->map(function ($item) {
                        $order = $item->order;
                        $product = $order?->product;
                        return [
                            'id' => $item->id,
                            'product_id' => $order?->product_id,
                            'product_code' => $product?->product_code,
                            'product_title_en' => $product?->product_title_en,
                            'product_title_cn' => $product?->product_title_cn,
                            'currency' => $item->f_currency ?? $order?->currency,
                            'qty' => $item->qty ?? $order?->qty,
                            'item_deposit' => $item->amount,
                            'base_item_deposit' => $item->base_amount,
                        ];
                    });
                break;

            default:
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid type. Use "JV" or "RV".',
                    'list' => [],
                ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $results->values(),
        ]);
    }
    public function getCreditDetails($refNumber,$type){
        switch (strtoupper($type)) {
            case 'CR':
                $results = Credit_note_customer_detail::with(['account', 'product'])
                    ->where('cr_number', $refNumber)
                    ->get()
                    ->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'account_code' => $item->account_code,
                            'product_id' => $item->product_id,
                            'product_code' => $item->product?->product_code,
                            'particulars' => $item->product?->product_code,
                            'product_title_en' => $item->product?->product_title_en,
                            'product_title_cn' => $item->product?->product_title_cn,
                            'currency' => $item->currency,
                            'description_en' => $item->account?->account_name_en,
                            'description_cn' => $item->account?->account_name_cn,
                            'ex_rate' => $item->ex_rate,
                            'amount' => $item->amount,
                            'base_amount' => $item->base_amount,
                        ];
                    });
                break;

            // Placeholder for other types (to be implemented)
            case 'RV': 
                $results = Receive_voucher_detail::with('order.product','account','invoice')
                    ->where('rv_number', $refNumber)
                    ->get()
                    ->map(function ($item) {
                        $order = $item->order;
                        $product = $order?->product;
                        return [
                            'id' => $item->id,
                            'product_id' => $order?->product_id,
                            'account_code' => $item?->account_code,
                            'product_code' => $product?->product_code,
                            'particulars' => $product?->product_code ?? $item->invoice?->invoice_no,
                            'invoice_no' => $item->invoice?->invoice_no,
                            'description_en' => $item->account?->account_name_en,
                            'description_cn' => $item->account?->account_name_cn,
                            'product_title_en' => $product?->product_title_en,
                            'product_title_cn' => $product?->product_title_cn,
                            'currency' => $item->f_currency ?? $order?->currency,
                            'qty' => $item->qty ?? $order?->qty,
                            'ex_rate' => $item->ex_rate,
                            'amount_paid' => $item->amount_paid,
                        ];
                    });
                break;
            case 'INV': 
                $results = Invoice_detail::with(['product', 'productService'])
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
                                'invoice_no' => $invDetail->invoice_no,
                                'product_code' => $invDetail->product->product_code ?? null,
                                'product_title_en' => $productTitle,
                                'product_title_cn' => $productTitleCN,
                                'currency' => $invDetail->currency,
                                'deposit' => $invDetail->deposit,
                                'qty' => $invDetail->qty,
                                'price' => $invDetail->price,
                                'total' => $invDetail->total,
                            ];
                        } else {
                            // Display service details if product_id is null
                            return [
                                'id' => $invDetail->id,
                                'type' => 'services',
                                'table_id' => $invDetail->service_id,
                                'invoice_no' => $invDetail->invoice_no,
                                'product_code' => $invDetail->productService->service_code ?? null,
                                'product_title_en' => $invDetail->productService->description_en ?? null,
                                'product_title_cn' => $invDetail->productService->description_cn ?? null,
                                'currency' => $invDetail->currency,
                                'deposit' => $invDetail->deposit,
                                'qty' => $invDetail->qty,
                                'price' => $invDetail->price,
                                'total' => $invDetail->total,
                            ];
                        }
                    });
                break;
            case 'AR': 
                $results = Invoice_detail::with(['product', 'productService'])
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
                                'product_code' => $invDetail->product->product_code ?? null,
                                'product_title_en' => $productTitle,
                                'product_title_cn' => $productTitleCN,
                                'currency' => $invDetail->currency,
                                'invoice_no' => $invDetail->invoice_no,
                                'deposit' => $invDetail->deposit,
                                'qty' => $invDetail->qty,
                                'price' => $invDetail->price,
                                'total' => $invDetail->total,
                            ];
                        } else {
                            // Display service details if product_id is null
                            return [
                                'id' => $invDetail->id,
                                'type' => 'services',
                                'table_id' => $invDetail->service_id,
                                'product_code' => $invDetail->productService->service_code ?? null,
                                'product_title_en' => $invDetail->productService->description_en ?? null,
                                'product_title_cn' => $invDetail->productService->description_cn ?? null,
                                'currency' => $invDetail->currency,
                                'invoice_no' => $invDetail->invoice_no,
                                'deposit' => $invDetail->deposit,
                                'qty' => $invDetail->qty,
                                'price' => $invDetail->price,
                                'total' => $invDetail->total,
                            ];
                        }
                    });
                
                break;
            case 'ORDER': 
                $refArray = explode(',', $refNumber);
                $results = Orders::with(['product'])
                    ->whereIn('id', $refArray)
                    ->get()
                    ->map(function ($order) {
                        // Check if the order has an associated product
                        if ($order->product) {
                            return collect([
                                'id' => $order->id,
                                'product_id' => $order->product_id,
                                'product_code' => $order->product?->product_code,
                                'product_title_en' => $order->product?->product_title_en,
                                'product_title_cn' => $order->product?->product_title_cn,
                                'currency' => $order->currency,
                                'price' => $order->price,
                                'qty' => $order->qty,
                                'total' => $order->price * $order->qty,  // Calculate total
                                'item_deposit' => $order->item_deposit,
                                'base_item_deposit' => $order->ex_rate
                                    ? $order->item_deposit * $order->ex_rate  // Apply exchange rate if available
                                    : null,
                            ]);
                        }
                        
                        // If no product is associated, return an empty collection
                        return collect();
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
