<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Carbon\Carbon;

use App\Models\General_ledger;
use App\Models\General_entries;
use App\Models\Receive_voucher_detail;
use App\Models\Account_customer_cn;
use App\Models\Orders;
use App\Models\Payment_orders_cn;
use App\Models\Credit_note_customer_detail;
use App\Models\Invoice_master;
use App\Models\Payment_voucher_detail;
use App\Models\Charts_of_account;
use App\Models\Receive_voucher_master;
use App\Models\Receive_voucher_master_invoices;
use App\Models\General_ledger_v2;

class ReportsController extends Controller{

    public function getAllTransactionList(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $page = (int) $request->input('page', 1);
        $search = $request->input('search', '');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $query = General_ledger::with([
            'supplier:id,suppliername_en,suppliername_cn,supplier_code',
            'customer:id,account_name_en,account_name_cn,customer_code',
        ])->limit(2000)->orderBy('id', 'desc');

        if ($dateFrom && $dateTo) {
            $query->whereBetween(DB::raw("STR_TO_DATE(transaction_date, '%b %d %Y')"), [$dateFrom, $dateTo]);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('currency', 'like', "%{$search}%")
                    ->orWhere('account_code', 'like', "%{$search}%")
                    ->orWhere('ref_data', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($sq) use ($search) {
                        $sq->where('supplier_code', 'like', "%{$search}%");
                    })
                    ->orWhereHas('customer', function ($cq) use ($search) {
                        $cq->where('customer_code', 'like', "%{$search}%");
                    });
            });
        }

        $allData = (clone $query)->get();

        $grouped = $allData->groupBy(function($item) {
            return $item->supplier_id . '_' . $item->customer_id . '_' . $item->ref_data . '_' . $item->pay_to;
        })->map(function($group) {
            $first = $group->first();

            $pay_to = $first->pay_to;
            $supplier_code = optional($first->supplier)->supplier_code;
            $customer_code = optional($first->customer)->customer_code;
            
            if(!empty($supplier_code) && strlen($supplier_code) > 2){
                $pay_to = $supplier_code;
            }
            if(!empty($customer_code) && strlen($customer_code) > 2){
                $pay_to = $customer_code;
            }
            return (object)[
                'id' => $group->max('id'),
                'currency' => $first->currency,
                'transaction_date' => $first->transaction_date,
                'pay_to' => $pay_to,
                'ex_rate' => (float)$first->ex_rate,
                'debit' => (float)$group->sum('debit'),
                'credit' => (float)$group->sum('credit'),
                'ref_data' => $first->ref_data,
                'updated_at' => $group->max('updated_at'),
                'details' => $group->map(function($detail) {
                    // chartOfAccount
                    $chartOfAccount = $detail->chartOfAccount;
                    $account_name_en = $chartOfAccount->account_name_en;
                    $account_name_cn = $chartOfAccount->account_name_cn;
                    return [
                        'id' => $detail->id,
                        'account_code' => $detail->account_code,
                        'currency' => $detail->currency,
                        'transaction_date' => $detail->transaction_date,
                        'debit' => (float)$detail->debit,
                        'credit' => (float)$detail->credit,
                        'ex_rate' => (float)$detail->ex_rate,
                        'ref_data' => $detail->ref_data,
                        'account_name_en' => $account_name_en,
                        'account_name_cn' => $account_name_cn,
                    ];
                })->values(),
            ];
        })->values();

        if ($perPage === -1) {
            $paginatedData = $grouped->map(fn($item) => $this->transformLedgerData($item));

            $response = [
                'current_page' => 1,
                'data' => $paginatedData,
                'last_page' => 1,
                'per_page' => $paginatedData->count(),
                'total' => $paginatedData->count(),
            ];
        } else {
            $total = $grouped->count();
            $lastPage = ceil($total / $perPage);
            $currentPage = min($page, $lastPage);
            
            $paginatedData = $grouped->slice(($currentPage - 1) * $perPage, $perPage)->values();
            $transformedData = $paginatedData->map(fn($item) => $this->transformLedgerData($item));

            $response = [
                'current_page' => $currentPage,
                'data' => $transformedData,
                'last_page' => $lastPage,
                'per_page' => $perPage,
                'total' => $total,
            ];
        }

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $response,
        ]);
    }
    private function transformLedgerData($item){
        $item->ex_rate = number_format((float)$item->ex_rate, 4);
        $item->debit = number_format((float)$item->debit, 2);
        $item->credit = number_format((float)$item->credit, 2);
        
        if (isset($item->details)) {
            $item->details = collect($item->details)->map(function($detail) {
                $detail = (object)$detail;
                $detail->ex_rate = number_format((float)$detail->ex_rate, 4);
                $detail->debit = number_format((float)$detail->debit, 2);
                $detail->credit = number_format((float)$detail->credit, 2);
                return $detail;
            });
        }
        
        return $item;
    }
    public function getJournalEntriesList(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');
        $customerCodes = $request->input('customer_codes', []);
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $categoryDates = $request->input('category_dates');
        // Start with the query builder, not the collection
        $query = General_entries::with(['customer'])
            ->where('credit','>',0)
            ->orderBy("id","DESC");

        // Filters
        if (!empty($customerCodes)) {
            $query->whereIn('customer_id', $customerCodes);
        }
        if ($categoryDates === 'Date' && $dateFrom && $dateTo) {
            $query->whereBetween(DB::raw("STR_TO_DATE(transaction_date, '%b %d %Y')"), [$dateFrom, $dateTo]);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('jv_no', 'like', "%{$search}%")
                    ->orWhere('account_code', 'like', "%{$search}%")
                    ->orWhere('invoice_no', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($q) use ($search) {
                        $q->where('customer_code', 'like', "%{$search}%")
                        ->orWhere('account_name_en', 'like', "%{$search}%")
                        ->orWhere('account_name_cn', 'like', "%{$search}%");
                    });
            });
        }

        // Clone query to get all data for footer totals
        $allData = (clone $query)->get();

        // Ensure transformOrderData returns 'total' and 'base_total' as float values
        $allDataTransformed = $allData->map(function ($order) {
            $transformed = $this->transformOrderData($order);

            // Ensure these fields exist and are numeric for summing
            $transformed['total'] = isset($transformed['total']) ? (float) $transformed['total'] : 0;
            $transformed['base_total'] = isset($transformed['base_total']) ? (float) $transformed['base_total'] : 0;

            return $transformed;
        });

        $currencyOrder = ['RMB', 'SG$', 'BASE_RMB', 'US$'];

        // Group and sum totals by currency
        $groupedTotals = $allDataTransformed->groupBy('currency')->map(function ($items, $currency) {
            return [
                'currency' => $currency,
                'total' => $items->sum('total'),
            ];
        });

        // Footer2: total amounts by currency in fixed order
        $footer2 = collect($currencyOrder)->map(function ($currency) use ($groupedTotals, $allDataTransformed) {
            return [
                'currency' => $currency,
                'total' => $currency === 'BASE_RMB'
                    ? $allDataTransformed->sum('base_total')
                    : ($groupedTotals->get($currency)['total'] ?? 0),
            ];
        })->values();

        // Handle pagination logic
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Example transform (you can customize this)
        $transform = function ($list) {
            $details = $this->JournalEntriesDetails($list->jv_no);
            $account_name_en = $list->customer->account_name_en;
            $account_name_cn = $list->customer->account_name_cn;
            $account_name_cn = ($account_name_cn === '' ? $account_name_en : $account_name_cn);
            return [
                'id' => $list->id,
                'transaction_date' => $list->transaction_date,
                'customer_code' => $list->customer->customer_code ?? '',
                'account_name_en' => $account_name_en ?? '',
                'account_name_cn' => $account_name_cn ?? '',
                'currency' => $list->currency,
                'jv_no' => $list->jv_no,
                'ex_rate' => number_format($list->ex_rate, 4),
                'amount' => $list->amount,
                'base_amount' => $list->base_amount,
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
                'footer2' => $footer2,
            ];
        } else {
            $data = $result->getCollection()->map($transform);
            $result->setCollection($data);
            $response = $result->toArray(); // Convert paginator to array
            $response['footer2'] = $footer2; // Inject footer2
        }

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $response,
        ]);
    }
    protected function transformOrderData($order){
        return [
            'currency' => $order->currency,
            'total' => $order->amount, // Or however total is calculated
            'base_total' => $order->base_amount,
        ];
    }
    public function JournalEntriesDetails($jv_no) {
        // Fetch the relevant data with relationships
        $query = General_entries::with(['chartOfAccount'])
            ->where('jv_no',$jv_no)
            ->orderByDesc('id')
            ->get();

        // Transform the data
        $transform = function ($list) {
            $account_name_en = $list->chartOfAccount->account_name_en ?? '';
            $account_name_cn = $list->chartOfAccount->account_name_cn ?? '';
            $account_name_cn = ($account_name_cn === '' ? $account_name_en : $account_name_cn);
            $customer_code = $list->customer->customer_code ?? '';
            return [
                'id' => $list->id ?? 0,
                'account_code' => $list->account_code,
                'currency' => $list->currency,
                'ex_rate' => number_format($list->ex_rate, 4),
                'amount' => $list->amount,
                'debit' => $list->debit,
                'credit' => $list->credit,
                'customer_code' => $customer_code,
                'account_name_en' => $account_name_en,
                'account_name_cn' => $account_name_cn,
            ];
        };
        // Apply the transformation and return
        return $query->map($transform);
    }
    public function getCustomerDeposit(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');
        $customerCodes = $request->input('customer_codes', []);
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $categoryDates = $request->input('category_dates');

        // Build subquery 1 - FIXED GROUP BY
        $sub1 = DB::table('t_rv_detail as a')
            ->select([
                DB::raw('MAX(a.id) as id'),
                'a.customer_id',
                'b.customer_code',
                'b.account_name_en',
                DB::raw("MAX(DATE_FORMAT(STR_TO_DATE(a.rv_date, '%M %d %Y'), '%Y%m%d')) as date_number"),
                'a.currency',
                DB::raw('SUM(a.amount) as amount'),
                DB::raw('SUM(a.base_amount) as base_amount')
            ])
            ->join('m_customer as b', 'b.id', '=', 'a.customer_id')
            ->whereRaw('CHAR_LENGTH(b.customer_code) > 1')
            ->where('a.account_code', 21301)
            ->when(!empty($customerCodes), function ($q) use ($customerCodes) {
                $q->whereIn('a.customer_id', $customerCodes);
            })
            ->when($categoryDates === 'Date' && $dateFrom && $dateTo, function ($q) use ($dateFrom, $dateTo) {
                $q->whereBetween(DB::raw("STR_TO_DATE(a.rv_date, '%M %d %Y')"), [$dateFrom, $dateTo]);
            })
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q2) use ($search) {
                    $q2->where('b.customer_code', 'like', "%{$search}%")
                        ->orWhere('b.account_name_en', 'like', "%{$search}%");
                });
            })
            ->groupBy('a.customer_id', 'b.customer_code', 'b.account_name_en', 'a.currency'); // ADDED customer_code and account_name_en

        // Build subquery 2 - FIXED GROUP BY
        $sub2 = DB::table('t_account_customer_cn as a')
            ->select([
                DB::raw('MAX(a.id) as id'),
                'a.customer_id',
                'b.customer_code',
                'b.account_name_en',
                DB::raw("MAX(DATE_FORMAT(STR_TO_DATE(a.transaction_date, '%M %d %Y'), '%Y%m%d')) as date_number"),
                'a.currency',
                DB::raw('SUM(a.amount) as amount'),
                DB::raw('SUM(a.base_amount) as base_amount')
            ])
            ->join('m_customer as b', 'b.id', '=', 'a.customer_id')
            ->whereRaw('CHAR_LENGTH(b.customer_code) > 1')
            ->whereRaw('(SELECT COUNT(*) FROM `t_payment_orders_cn` z WHERE z.account_customer_cn_id = a.id) > 0')
            ->when(!empty($customerCodes), function ($q) use ($customerCodes) {
                $q->whereIn('a.customer_id', $customerCodes);
            })
            ->when($categoryDates === 'Date' && $dateFrom && $dateTo, function ($q) use ($dateFrom, $dateTo) {
                $q->whereBetween(DB::raw("STR_TO_DATE(a.transaction_date, '%M %d %Y')"), [$dateFrom, $dateTo]);
            })
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q2) use ($search) {
                    $q2->where('b.customer_code', 'like', "%{$search}%")
                        ->orWhere('b.account_name_en', 'like', "%{$search}%");
                });
            })
            ->groupBy('a.customer_id', 'b.customer_code', 'b.account_name_en', 'a.currency'); // ADDED customer_code and account_name_en

        // Union them
        $union = $sub1->unionAll($sub2);

        // Wrap union - NOW you can use MAX since data is already grouped properly
        $wrapper = DB::table(DB::raw("({$union->toSql()}) as sub"))
            ->mergeBindings($union)
            ->select([
                DB::raw('MAX(sub.id) as id'),
                'sub.customer_id',
                'sub.customer_code', // Changed from MAX to direct reference
                'sub.account_name_en', // Changed from MAX to direct reference
                'sub.currency',
                DB::raw('SUM(sub.amount) as amount'),
                DB::raw('SUM(sub.base_amount) as base_amount'),
                DB::raw('MAX(sub.date_number) as date_number')
            ])
            ->groupBy('sub.customer_id', 'sub.customer_code', 'sub.account_name_en', 'sub.currency') // ADDED all non-aggregated columns
            ->orderBy(DB::raw('MAX(sub.date_number)'), 'DESC');

        // Clone query to get all data for footer totals
        $allData = (clone $wrapper)->get();

        // Rest of your code remains the same...
        $allDataTransformed = $allData->map(function ($order) {
            $transformed = $this->transformOrderData($order);
            $transformed['total'] = isset($transformed['total']) ? (float) $transformed['total'] : 0;
            $transformed['base_total'] = isset($transformed['base_total']) ? (float) $transformed['base_total'] : 0;
            return $transformed;
        });

        $currencyOrder = ['RMB', 'SG$', 'BASE_RMB', 'US$'];

        $groupedTotals = $allDataTransformed->groupBy('currency')->map(function ($items, $currency) {
            return [
                'currency' => $currency,
                'total' => $items->sum('total'),
            ];
        });

        $footer2 = collect($currencyOrder)->map(function ($currency) use ($groupedTotals, $allDataTransformed) {
            return [
                'currency' => $currency,
                'total' => $currency === 'BASE_RMB'
                    ? $allDataTransformed->sum('base_total')
                    : ($groupedTotals->get($currency)['total'] ?? 0),
            ];
        })->values();

        if ($perPage === -1) {
            $rows = $wrapper->get();
        } else {
            $rows = $wrapper->paginate($perPage);
        }

        $transform = function ($row) {
            return [
                'id' => $row->id,
                'customer_id' => $row->customer_id,
                'customer_code' => $row->customer_code,
                'account_name_en' => $row->account_name_en,
                'currency' => $row->currency,
                'amount' => $row->amount,
                'base_amount' => $row->base_amount,
            ];
        };

        if ($perPage === -1) {
            $data = $rows->map($transform);
            $response = [
                'current_page' => 1,
                'data' => $data,
                'last_page' => 1,
                'per_page' => $data->count(),
                'total' => $data->count(),
                'footer2' => $footer2,
            ];
        } else {
            $items = $rows->getCollection()->map($transform);
            $rows->setCollection($items);
            $response = $rows->toArray();
            $response['footer2'] = $footer2;
        }

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $response,
        ]);
    }
    public function doDepositDetails($customerId){
        $resultArray = [];
        $totalDeposit = 0;

        $ids = Orders::where('customer_id', $customerId)
            ->where('order_status', 1)
            ->pluck('id');

        foreach ($ids as $orderId) {
            // 🔹 1. Receive Voucher
            $rvouchers = Receive_voucher_detail::where('order_id', $orderId)
                ->orderBy('rv_number')
                ->get();

            foreach ($rvouchers as $rv) {

                $resultArray[] = [
                    'id'                => $rv->id,
                    'transaction_date'  => $rv->rv_date,
                    'reference'         => $rv->rv_number,
                    'product_code'      => $rv->product->product_code ?? '',
                    'product_title_en'  => $rv->product->product_title_en ?? '',
                    'product_title_cn'  => $rv->product->product_title_cn ?? '',
                    'currency'          => $rv->currency,
                    'amount'            => $rv->amount,
                    'base_amount'       => $rv->base_amount,
                ];

                $totalDeposit += floatval($rv->amount);
            }

            // 🔹 2. Journal Voucher (Account Customer CN)
            $payments = Payment_orders_cn::with(['accountCustomerCn', 'order.product'])
                ->where('order_id', $orderId)
                ->get();

            foreach ($payments as $payment) {
                $account = $payment->accountCustomerCn;
                $order = $payment->order;
                if (!$account || !$order) continue;

                $amt = $payment->payment_order;

                $resultArray[] = [
                    'id'                => $account->id,
                    'transaction_date'  => $account->transaction_date,
                    'reference'         => $account->ref_data,
                    'product_code'      => $order->product->product_code ?? '',
                    'product_title_en'  => $order->product->product_title_en ?? '',
                    'product_title_cn'  => $order->product->product_title_cn ?? '',
                    'currency'          => $account->currency,
                    'amount'            => $amt,
                    'base_amount'       => $account->base_amount,
                ];
                $totalDeposit += floatval($amt);
            }

            // 🔹 3. Credit Notes
            $creditNotes = Credit_note_customer_detail::with(['product'])->where('order_id', $orderId)
                ->orderBy('cr_number')
                ->get();

            foreach ($creditNotes as $cr) {
                $resultArray[] = [
                    'id'                => $cr->id,
                    'transaction_date'  => $cr->cr_date,
                    'reference'         => $cr->cr_number,
                    'product_code'      => $cr->particulars,
                    'product_title_en'  => $order->product->product_title_en ?? '',
                    'product_title_cn'  => $order->product->product_title_cn ?? '',
                    'currency'          => $cr->currency,
                    'amount'            => $cr->amount,
                    'base_amount'       => $cr->base_amount
                ];
                $totalDeposit += floatval($cr->amount);
            }
        }
        
        // Sort resultArray by 'date' descending
        usort($resultArray, function ($a, $b) {
            return strtotime($b['transaction_date']) <=> strtotime($a['transaction_date']);
        });
        
        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $resultArray,
        ]);

    }
    public function isAmountSameInDeposit($orderId, $amount){
        $exists = Orders::where('id', $orderId)
            ->where('item_deposit', '!=', $amount)
            ->exists();

        return $exists ? $orderId : 0;
    }
    public function getProfitAndLoss($date_from, $date_to, $currency){

        $from = Carbon::createFromFormat('M d Y', $date_from)->format('Ymd');
        $to = Carbon::createFromFormat('M d Y', $date_to)->format('Ymd');

        $sales = Invoice_master::where('invoice_status_id',1)->whereRaw(
            "DATE_FORMAT(STR_TO_DATE(invoice_date, '%M %d %Y'), '%Y%m%d') BETWEEN ? AND ?",
            [$from, $to]
        )->get();

        $gl = General_ledger::whereRaw(
            "DATE_FORMAT(STR_TO_DATE(transaction_date, '%M %d %Y'), '%Y%m%d') BETWEEN ? AND ?",
            [$from, $to]
        );

        $glRecords = $gl->get();

        $sales2 = Invoice_master::with(['receiveVoucherMasterInvoices'])->where('invoice_status_id',1)->whereRaw(
            "DATE_FORMAT(STR_TO_DATE(invoice_date, '%M %d %Y'), '%Y%m%d') BETWEEN ? AND ?",
            [$from, $to]
        )->whereHas('receiveVoucherMasterInvoices')->get();

        $rvMasterIds = $sales2->flatMap(function ($invoice) {
            return $invoice->receiveVoucherMasterInvoices->pluck('rv_master_id');
        })->unique()->values();

        $totalRVs = Receive_voucher_master::whereIn('id',$rvMasterIds)->sum('base_amount_paid');
        $totalInvs = $sales2->sum('base_total_to_pay');
        
        // Clone the query to calculate sum for account_code 21604
        $misc_income = (clone $gl)
            ->where('account_code', 21604)
            ->sum('debit') ?? 0;

        $other_income = (clone $gl)
            ->whereIn('account_code', [70002,70001])
            ->sum('credit') ?? 0;

        $sales_amount = $sales->sum('base_total') ?? 0;
        $cogs_amount = $sales->sum('sub_total_on_cost') ?? 0;

        $baseCurrency = "RMB";
        $tax = 0;
        $inventory_cost = 0;
        $ex_rate_diff = $totalInvs - $totalRVs;
        $ex_rate_gain = 0;
        $ex_rate_loss = 0;
        $assets = 0;
        $expenses = $this->getAllExpenses($from,$to,$currency,$baseCurrency);
        $total_revenues = $sales_amount - $misc_income - $tax;
        $gross_profit = $sales_amount - $cogs_amount - $inventory_cost + $other_income;
        $net_profit = $gross_profit - $expenses->sum('amount');

        if($ex_rate_diff > 0){
            $net_profit = $net_profit + $ex_rate_diff;
            $ex_rate_gain = $ex_rate_diff;
        }
        else{
            $net_profit = $net_profit - $ex_rate_diff;
            $ex_rate_loss = abs($ex_rate_diff);
        }

        $data = [
            'date_from' => $date_from,
            'date_to' => $date_to,
            'currency' => $currency,
            'sales_amount' => $sales_amount,
            'cogs_amount' => $cogs_amount,
            'misc_income' => $misc_income,
            'other_income' => $other_income,
            'ex_rate_gain' => $ex_rate_gain,
            'ex_rate_loss' => $ex_rate_loss,
            'inventory_cost' => $inventory_cost,
            'tax' => $tax,
            'assets' => $assets,
            'total_revenues' => $total_revenues,
            'net_sales_revenues' => $total_revenues,
            'total_expenses' => $expenses->sum('amount'),
            'gross_profit' => $gross_profit,
            'net_profit' => $net_profit,
            'expenses' => $expenses,
        ];
        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $data
        ]);
    }
    public function getAllExpenses($fromYmd, $toYmd, $currency, $baseCurrency){
        // Convert to Ymd format
        // Step 1: Get account codes under 60000
        $expenseAccounts = Charts_of_account::where('account_code', 'LIKE', '6%')->pluck('account_code');

        // Step 2: Get expenses from payment vouchers
        $pvExpenses = Payment_voucher_detail::with('chartOfAccount')
            ->whereIn('account_code', $expenseAccounts)
            ->get()
            ->filter(function ($item) use ($fromYmd, $toYmd) {
                $itemDate = Carbon::createFromFormat('M d Y', $item->pv_date)->format('Ymd');
                return $itemDate >= $fromYmd && $itemDate <= $toYmd;
            })
            ->map(function ($item) use ($currency, $baseCurrency) {
                $amount = $item->amount;

                if ($currency !== $baseCurrency && $item->ex_rate > 0) {
                    $amount = $item->amount / $item->ex_rate;
                }

                return [
                    'account_code' => $item->account_code,
                    'account_name_en' => $item->chartOfAccount->account_name_en ?? '',
                    'account_name_cn' => $item->chartOfAccount->account_name_cn ?? '',
                    'amount' => $amount,
                ];
            });

        // Step 3: Add specific account from general ledger
        $glExpenses = General_ledger::with('chartOfAccount')
            ->where('account_code', '69200')
            ->get()
            ->filter(function ($item) use ($fromYmd, $toYmd) {
                $itemDate = Carbon::createFromFormat('M d Y', $item->transaction_date)->format('Ymd');
                return $itemDate >= $fromYmd && $itemDate <= $toYmd;
            })
            ->map(function ($item) use ($currency, $baseCurrency) {
                $amount = $item->amount;

                if ($currency !== $baseCurrency && $item->ex_rate > 0) {
                    $amount = $item->amount / $item->ex_rate;
                }

                return [
                    'account_code' => $item->account_code,
                    'account_name_en' => $item->chartOfAccount->account_name_en ?? '',
                    'account_name_cn' => $item->chartOfAccount->account_name_cn ?? '',
                    'amount' => $amount,
                ];
            });

        // Step 4: Combine and group by account_code
        $merged = $pvExpenses->merge($glExpenses);

        $grouped = $merged->groupBy('account_code')->map(function ($items, $code) {
            return [
                'account_code' => $code,
                'account_name_en' => $items->first()['account_name_en'],
                'account_name_cn' => $items->first()['account_name_cn'],
                'amount' => $items->sum('amount'),
            ];
        })->values();

        return $grouped;
    }
    public function getProfitSalesRevenue(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        // Parse dates to Ymd string to compare with formatted DB values
        $from = Carbon::parse($dateFrom)->format('Ymd');
        $to = Carbon::parse($dateTo)->format('Ymd');

        // Base query: invoices status = 1 and in date range
        $baseQuery = Invoice_master::with(['customer'])
            ->where('invoice_status_id', 1)
            ->whereRaw(
                "DATE_FORMAT(STR_TO_DATE(invoice_date, '%M %d %Y'), '%Y%m%d') BETWEEN ? AND ?",
                [$from, $to]
            )->orderBy('id', 'desc');

        // Apply search if any (on the query, not on collection)
        if ($search) {
            $baseQuery = $baseQuery->where(function ($q) use ($search) {
                $q->where('invoice_no', 'like', "%{$search}%")
                    ->orWhere('so_number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($q2) use ($search) {
                        $q2->where('customer_code', 'like', "%{$search}%")
                            ->orWhere('account_name_en', 'like', "%{$search}%")
                            ->orWhere('account_name_cn', 'like', "%{$search}%");
                    });
            });
        }

        // Clone for footer totals before pagination
        $allData = (clone $baseQuery)->get();

        // Transform orders to simplified arrays for summing
        $allDataTransformed = $allData->map(function ($order) {
            $transformed = $this->transformOrderData($order);
            $transformed['total'] = isset($transformed['total']) ? (float)$transformed['total'] : 0.0;
            $transformed['base_total'] = isset($transformed['base_total']) ? (float)$transformed['base_total'] : 0.0;
            return $transformed;
        });

        $currencyOrder = ['RMB', 'SG$', 'BASE_RMB', 'US$'];

        // Group totals by currency
        $groupedTotals = $allDataTransformed->groupBy('currency')->map(function ($items, $currency) {
            return [
                'currency' => $currency,
                'total' => $items->sum('total'),
            ];
        });

        // Build footer2 safely
        $footer2 = collect($currencyOrder)->map(function ($currency) use ($groupedTotals, $allDataTransformed) {
            $group = $groupedTotals->get($currency);
            return [
                'currency' => $currency,
                'total' => $currency === 'BASE_RMB'
                    ? $allDataTransformed->sum('base_total')
                    : ($group['base_total'] ?? 0),
            ];
        })->values();

        // Pagination or full
        $result = $perPage === -1 ? $baseQuery->get() : $baseQuery->paginate($perPage);

        // Define transformation for each record
        $transform = function ($list) {
            $account_name_en = $list->customer->account_name_en ?? '';
            $account_name_cn = $list->customer->account_name_cn ?? '';
            if ($account_name_cn === '') {
                $account_name_cn = $account_name_en;
            }
            return [
                'id' => $list->id,
                'transaction_date' => $list->invoice_date,
                'ref_data' => $list->invoice_no,
                'customer_code' => $list->customer->customer_code ?? '',
                'account_name_en' => $account_name_en,
                'account_name_cn' => $account_name_cn,
                'currency' => $list->currency,
                'ex_rate' => number_format($list->ex_rate, 4),
                'amount' => $list->total,
                'base_amount' => $list->base_total,
                'sub_total_on_cost' => $list->sub_total_on_cost,
            ];
        };

        if ($perPage === -1) {
            $data = $result->map($transform);
            $response = [
                'current_page' => 1,
                'data' => $data,
                'last_page' => 1,
                'per_page' => $data->count(),
                'total' => $data->count(),
                'footer2' => $footer2,
            ];
        } else {
            $data = $result->getCollection()->map($transform);
            $result->setCollection($data);
            $response = $result->toArray();
            $response['footer2'] = $footer2;
        }

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $response,
        ]);
    }
    public function getOthereIcome(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search', '');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        // Parse dates to Ymd string to compare with formatted DB values
        $from = Carbon::parse($dateFrom)->format('Ymd');
        $to = Carbon::parse($dateTo)->format('Ymd');

        // Base query: invoices status = 1 and in date range
        $baseQuery = General_ledger::with(['customer'])
            ->whereIn('account_code', [70002,70001])
            ->whereRaw(
                "DATE_FORMAT(STR_TO_DATE(transaction_date, '%M %d %Y'), '%Y%m%d') BETWEEN ? AND ?",
                [$from, $to]
            )->orderBy('id', 'desc');

        // Apply search if any (on the query, not on collection)
        if ($search) {
            $baseQuery = $baseQuery->where(function ($q) use ($search) {
                $q->where('account_code', 'like', "%{$search}%")
                    ->orWhere('invoice_no', 'like', "%{$search}%")
                    ->orWhere('ref_data', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($q2) use ($search) {
                        $q2->where('customer_code', 'like', "%{$search}%")
                            ->orWhere('account_name_en', 'like', "%{$search}%")
                            ->orWhere('account_name_cn', 'like', "%{$search}%");
                    });
            });
        }

        // Clone for footer totals before pagination
        $allData = (clone $baseQuery)->get();

        // Transform orders to simplified arrays for summing
        $allDataTransformed = $allData->map(function ($order) {
            $transformed = $this->transformOrderData($order);
            $transformed['total'] = isset($transformed['total']) ? (float)$transformed['total'] : 0.0;
            $transformed['base_total'] = isset($transformed['credit']) ? (float)$transformed['credit'] : 0.0;
            return $transformed;
        });

        $currencyOrder = ['RMB', 'SG$', 'BASE_RMB', 'US$'];

        // Group totals by currency
        $groupedTotals = $allDataTransformed->groupBy('currency')->map(function ($items, $currency) {
            return [
                'currency' => $currency,
                'total' => $items->sum('total'),
            ];
        });

        // Build footer2 safely
        $footer2 = collect($currencyOrder)->map(function ($currency) use ($groupedTotals, $allDataTransformed) {
            $group = $groupedTotals->get($currency);
            return [
                'currency' => $currency,
                'total' => $currency === 'BASE_RMB'
                    ? $allDataTransformed->sum('base_total')
                    : ($group['base_total'] ?? 0),
            ];
        })->values();

        // Pagination or full
        $result = $perPage === -1 ? $baseQuery->get() : $baseQuery->paginate($perPage);

        // Define transformation for each record
        $transform = function ($list) {
            $account_name_en = $list->customer->account_name_en ?? '';
            $account_name_cn = $list->customer->account_name_cn ?? '';
            if ($account_name_cn === '') {
                $account_name_cn = $account_name_en;
            }
            return [
                'id' => $list->id,
                'transaction_date' => $list->transaction_date,
                'ref_data' => $list->invoice_no,
                'customer_code' => $list->customer->customer_code ?? '',
                'account_name_en' => $account_name_en,
                'account_name_cn' => $account_name_cn,
                'currency' => $list->currency,
                'ex_rate' => number_format($list->ex_rate, 4),
                'amount' => $list->amount,
                'base_amount' => $list->credit,
            ];
        };

        if ($perPage === -1) {
            $data = $result->map($transform);
            $response = [
                'current_page' => 1,
                'data' => $data,
                'last_page' => 1,
                'per_page' => $data->count(),
                'total' => $data->count(),
                'footer2' => $footer2,
            ];
        } else {
            $data = $result->getCollection()->map($transform);
            $result->setCollection($data);
            $response = $result->toArray();
            $response['footer2'] = $footer2;
        }

        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => $response,
        ]);
    }
    public function getTrialBalance($dateFrom, $dateTo) {
        $from = Carbon::parse($dateFrom)->format('Ymd');
        $to = Carbon::parse($dateTo)->format('Ymd');

        $getAccounts = function ($prefix, $sumField) use ($from, $to) {
            return General_ledger_v2::with('chartOfAccount')
                ->where('account_code', 'like', "$prefix%")
                ->whereRaw("DATE_FORMAT(STR_TO_DATE(transaction_date, '%M %d %Y'), '%Y%m%d') BETWEEN ? AND ?", [$from, $to])
                ->get()
                ->groupBy('account_code')
                ->map(function ($items) use ($sumField) {
                    $first = $items->first();
                    $sumAmount = $items->sum($sumField);

                    if ($sumAmount <= 0) return null;

                    $account_name_en = $first->chartOfAccount->account_name_en ?? '';
                    $account_name_cn = $first->chartOfAccount->account_name_cn ?? '';
                    $account_name_cn = ($account_name_cn === '' ? $account_name_en : $account_name_cn);

                    return [
                        'account_code'     => $first->account_code,
                        'transaction_date' => $first->transaction_date,
                        'account_name_en'  => $account_name_en,
                        'account_name_cn'  => $account_name_cn,
                        'amount'           => $sumAmount,
                    ];
                })
                ->filter()
                ->values();
        };

        // Get accounts
        $assets = $getAccounts('1', 'debit');
        $liabilities = $getAccounts('2', 'credit');
        $equity = $getAccounts('3', 'credit');

        // Calculate totals
        $assetsTotal = $assets->sum('amount');
        $liabilitiesTotal = $liabilities->sum('amount');
        $equityTotal = $equity->sum('amount');

        return response()->json([
            'assets' => [
                'data' => $assets,
                'total' => $assetsTotal,
            ],
            'liabilities' => [
                'data' => $liabilities,
                'total' => $liabilitiesTotal,
            ],
            'equity' => [
                'data' => $equity,
                'total' => $equityTotal,
            ],
        ]);
    }
}
