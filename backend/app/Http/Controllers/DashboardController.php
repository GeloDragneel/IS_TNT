<?php

namespace App\Http\Controllers;
use Carbon\Carbon;

use App\Models\Shipout_items;
use App\Models\Products;
use App\Models\Customer;
use App\Models\Orders;
use App\Models\Forex;
use App\Models\Supplier;
use App\Models\Currencies;
use App\Models\Grn_master;
use App\Models\Grn_details;
use App\Models\Internal_Transfer;
use App\Models\Invoice_master;
use App\Models\Invoice_detail;
use App\Models\Manufacturer;
use App\Models\Inventory_allocation;
use App\Models\Most_viewed_product;
use App\Models\Accounts_payable_master;
use App\Models\POrder_master;
use App\Models\POrder_detail;
use App\Models\General_ledger;
use App\Models\Receive_voucher_master;
use App\Models\Payment_voucher_master;
use App\Models\Payment_voucher_detail;
use App\Models\General_entries;
use App\Models\Inventory_tblmaster;
use App\Models\Sales_order_master;
use App\Models\Sales_order_detail;

use Illuminate\Support\Facades\DB;

use Illuminate\Http\Request;

class DashboardController extends Controller{

    public function getDashboardShipments(){
        return Shipout_items::with([
                'customer',
                'courier',
                'shippingStatus'
            ])
            ->where('status', 2)
            ->whereDate('date', '>=', Carbon::now()->subDays(3)->toDateString())
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->get()
            ->groupBy('invoice_no')
            ->map(function ($group) {
                $item = $group->first();
                $details = $group->map(function ($detailItem) {
                    return [
                        'id' => $detailItem->id,
                        'product_code' => $detailItem->product->product_code ?? '',
                        'product_title_en' => $detailItem->product->product_title_en ?? '',
                        'product_title_cn' => $detailItem->product->product_title_cn ?? '',
                        'qty' => $detailItem->qty,
                    ];
                })->values(); // Ensure it's a proper indexed array

                return [
                    'id' => $item->id,
                    'shipout_date' => Carbon::parse($item->date)->format('M d Y'),
                    'customer_code' => $item->customer->customer_code ?? '',
                    'account_name_en' => $item->customer->account_name_en ?? '',
                    'account_name_cn' => $item->customer->account_name_cn ?? '',
                    'courier_en' => $item->courier->courier_en ?? '',
                    'courier_cn' => $item->courier->courier_cn ?? '',
                    'tracking' => $item->tracking,
                    'invoice_no' => $item->invoice_no,
                    'shipped_packages' => $item->shipped_packages,
                    'details' => $details,  // Include the nested details
                ];
            })->values()->toArray(); // Ensure the final result is an array
    }
    public function getDashboardPreorderClosing(){
        return Products::with(['supplier'])
            ->where('is_deleted', 0)
            ->get()
            ->filter(function ($product) {
                if (!$product->preorder_end_date) return false;

                // Parse string like "Mar 20 2025" safely
                try {
                    $preorderEnd = Carbon::createFromFormat('M d Y', $product->preorder_end_date);
                    return $preorderEnd->greaterThanOrEqualTo(Carbon::today());
                } catch (\Exception $e) {
                    return false;
                }
            })
            ->sortBy(function ($product) {
                return Carbon::createFromFormat('M d Y', $product->preorder_end_date);
            })
            ->map(function ($product) {
                $order_qty = Orders::where('product_id',$product->id)
                    ->where('show_category','orders')
                    ->sum('qty');

                return [
                    'id' => $product->id,
                    'product_code' => $product->product_code,
                    'product_title_en' => $product->product_title_en,
                    'product_title_cn' => $product->product_title_cn,
                    'preorder_start_date' => $product->preorder_start_date,
                    'preorder_end_date' => $product->preorder_end_date,
                    'po_dateline' => $product->po_dateline,
                    'pcs_per_carton' => $product->pcs_per_carton,
                    'item_cost' => $product->item_cost,
                    'item_cost_currency' => $product->item_cost_currency,
                    'supplier_code' => $product->supplier->supplier_code ?? '',
                    'supplier_name' => $product->supplier->suppliername_en ?? '',
                    'order_qty' => $order_qty,
                    'version_no' => date('Ymdhis')
                ];
            })->values();
    }
    public function getDashboardNewOrders(){
        return Orders::with([
                'customer.source',
                'product'
            ])->where('show_category','orders')
            ->where('order_status', '!=', 1)
            ->get()
            ->sortByDesc(function ($order) {
                try {
                    return Carbon::createFromFormat('M d Y', $order->order_date)->format('Ymd');
                } catch (\Exception $e) {
                    return 0;
                }
            })->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_date' => $order->order_date,
                    'account_name_en' => $order->customer->account_name_en ?? '',
                    'account_name_cn' => $order->customer->account_name_cn ?? '',
                    'customer_code' => $order->customer->customer_code ?? '',
                    'customer_type' => $order->customer->customer_type ?? '',
                    'order_status' => $order->order_status,
                    'qty' => $order->qty,
                    'product_code' => $order->product->product_code ?? '',
                    'product_title_en' => $order->product->product_title_en ?? '',
                    'product_title_cn' => $order->product->product_title_cn ?? '',
                    'currency' => $order->currency,
                    'price' => $order->price,
                    'user_id' => $order->customer->user_id ?? '',
                    'source_en' => $order->customer->source->description_en ?? '',
                    'source_cn' => $order->customer->source->description_cn ?? '',
                ];
            })
            ->values();
    }
    public function getDashboardExRates(){
        // Get list of active currency codes (not deleted)
        $currencies = Currencies::where('is_deleted', 0)->pluck('code');

        // Get latest 7 unique date_enter values (1 current + 5 history + 1 for trend comparison)
        $dates = Forex::select('date_enter')
            ->groupBy('date_enter')
            ->orderByRaw('MAX(id) DESC')
            ->limit(7)
            ->pluck('date_enter');

        // Get all forex rates for these dates
        $forexRates = Forex::whereIn('date_enter', $dates)
            ->get()
            ->groupBy('to_currency');

        // Map only the first 6 rows (1 current + 5 history)
        $history = $dates->take(6)->map(function ($date, $index) use ($forexRates, $currencies, $dates) {
            $row = ['date' => Carbon::parse($date)->format('M d Y')];
            
            // Get the next date (chronologically previous) for comparison
            $nextDate = $dates->get($index + 1);
            
            foreach ($currencies as $currency) {
                $rate = optional($forexRates[$currency] ?? collect())->firstWhere('date_enter', $date);
                $rateValue = $rate ? $rate->ex_rate : null;
                $formattedRate = $rateValue !== null ? number_format($rateValue, 4) : null;

                $row[$currency] = $formattedRate;

                // Trend comparison with next date's rate (previous chronologically)
                if ($nextDate) {
                    $previousRate = optional($forexRates[$currency] ?? collect())->firstWhere('date_enter', $nextDate);
                    $previousRateValue = $previousRate ? $previousRate->ex_rate : null;
                    
                    if ($rateValue === null || $previousRateValue === null) {
                        $row[$currency . '_trend'] = '—';
                    } elseif ($rateValue > $previousRateValue) {
                        $row[$currency . '_trend'] = 'up';
                    } elseif ($rateValue < $previousRateValue) {
                        $row[$currency . '_trend'] = 'down';
                    } else {
                        $row[$currency . '_trend'] = 'default';
                    }
                } else {
                    $row[$currency . '_trend'] = '—';
                }
            }

            return $row;
        });

        // Get current (latest rate) as the first item in history
        $current = $history->first();

        // Exclude the current date from history
        $history = $history->slice(1);

        return [
            'current' => $current,
            'currencies' => $currencies,
            'history' => $history
        ];
    }
    public function getDashboardItemsAndInventory($m,$y){
        // Step 1: Get invoice details for the given month/year
        $invMaster = Invoice_detail::with(['product.manufacturer'])
            ->where('invoice_status_id', 1)
            ->whereRaw(
                'YEAR(STR_TO_DATE(invoice_date, "%b %d %Y")) = ? AND MONTH(STR_TO_DATE(invoice_date, "%b %d %Y")) = ?',
                [$y, $m]
            )->orderByDesc('id')->get();
    
        $colorPalette = [
            'bg-blue-500',
            'bg-cyan-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-red-500',
        ];

        $salesByManufacturer = $invMaster
            ->filter(fn($item) => !empty($item->product?->manufacturer_id))
            ->groupBy(fn($item) => $item->product->manufacturer_id)
            ->map(function ($items, $manufacturerId) {
                $first = $items->first();
                // defensive fallback if product/manufacturer missing on that first row
                $manufacturer = $first->product->manufacturer ?? null;

                return [
                    'manufacturer_id'   => $manufacturerId,
                    'manufacturer_en'   => $manufacturer->manufacturer_en ?? '',
                    'manufacturer_cn'   => $manufacturer->manufacturer_cn ?? '',
                    'sumAmount'         => $items->sum('base_total'),
                ];
            })
            ->sortByDesc('sumAmount')
            ->take(5) // ✅ only top 5
            ->values()
            ->map(function ($item, $index) use ($colorPalette) {
                $item['color'] = $colorPalette[$index % count($colorPalette)]; // ✅ assign color by index
                return $item;
            });

        $internalTransfer = Internal_Transfer::with(['product'])->whereRaw(
            'YEAR(STR_TO_DATE(transfer_date, "%b %d %Y")) = ? AND MONTH(STR_TO_DATE(transfer_date, "%b %d %Y")) = ?',
            [$y, $m]
        )->get()
        ->map(function ($item) {
            return [
                'transfer_date' => $item->transfer_date,
                'product_code' => $item->product->product_code ?? '',
                'product_title_en' => $item->product->product_title_en ?? '',
                'product_title_cn' => $item->product->product_title_cn ?? '',
                'warehouse_from' => $item->warehouse_from,
                'warehouse_to' => $item->warehouse_to,
                'qty' => $item->qty,
            ];
        });

        $mostViewProduct = Most_viewed_product::with('product')
            ->whereHas('product')
            ->get()
            ->groupBy('product_id')
            ->map(function ($group) {
                $product = $group->first()->product;
                return [
                    'product_code'     => $product->product_code,
                    'product_title_en' => $product->product_title_en,
                    'product_title_cn' => $product->product_title_cn,
                    'sumCount'         => $group->sum('count'),
                ];
            })
            ->sortByDesc('sumCount')
            ->take(5)
            ->values();

        // calculate total only for the top 5
        $totalTop5 = $mostViewProduct->sum('sumCount');

        // add percentage and color for only these 5
        $mostViewProduct = $mostViewProduct->map(function ($item, $index) use ($totalTop5, $colorPalette) {
            $item['percentage'] = $totalTop5 > 0
                ? round(($item['sumCount'] / $totalTop5) * 100, 2)
                : 0;

            // assign color by index
            $item['color'] = $colorPalette[$index % count($colorPalette)];

            return $item;
        });

        /*
        $bestSellingProducts = $invMaster
            ->filter(fn($item) => !empty($item->product_id))
            ->groupBy(fn($item) => $item->product_id)
            ->map(function ($items, $product_id) {
                $first = $items->first();
                $product = $first->product ?? null;

                return [
                    'product_id' => $product_id,
                    'product_code' => $product->product_code ?? '',
                    'product_title_en' => $product->product_title_en ?? '',
                    'product_title_cn' => $product->product_title_cn ?? '',
                    'qty' => $items->sum('qty'),
                ];
            })
            ->sortByDesc('qty')
            ->values();
        */

        $totals = Products::select('is_deleted', 'hold_qty')
            ->get()
            ->groupBy('is_deleted')
            ->map(function ($group, $key) {
                return [
                    'count' => $group->count(),
                    'hold_qty' => $group->sum('hold_qty'),
                ];
            });

        $totalProducts = $totals[0]['count'] ?? 0;     // Active products
        $totalArchive  = $totals[1]['count'] ?? 0;     // Archived products
        $totalHoldQty  = $totals[0]['hold_qty'] ?? 0;  // Hold qty only for active products

        $totalAvailableStock = Inventory_tblmaster::get()
            ->sum(function ($item) {
                return $item->qty - $item->allocated_qty;
            });

        return response()->json([
            'salesByManufacturer' => $salesByManufacturer,
            // 'withdrawFromInventory' => $withdrawFromInventory,
            'internalTransfer' => $internalTransfer,
            'mostViewProduct' => $mostViewProduct,
            // 'bestSellingProducts' => $bestSellingProducts,
            'totalProducts' => number_format($totalProducts,0),
            'totalArchive' => $totalArchive,
            'totalAvailableStock' => number_format($totalAvailableStock,0),
            'totalHoldQty' => $totalHoldQty,
        ]);
    }
    public function getDashboardLogistics($m,$y){
        $grnDetails = Grn_details::with(['supplier'])->whereRaw(
            'YEAR(STR_TO_DATE(grn_date, "%b %d %Y")) = ?',[$y]
        )->get();


        $colorPalette = [
            'bg-blue-500',
            'bg-purple-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-red-500',
        ];

        // Group and sum by month (using grn_date consistently)
        $grouped = $grnDetails
            ->groupBy(function ($item) {
                return Carbon::createFromFormat('M d Y', $item->grn_date)->format('n'); // numeric month 1–12
            })
            ->map(function ($items) {
                return $items->sum('qty');
            });

        // Build final array for the last 6 months (including current)
        $delivery = collect(range(0, 5)) // 0 = current month, 5 = 5 months ago
            ->map(function ($i) use ($grouped) {
                $month = Carbon::now()->subMonths($i);
                $monthNum = $month->month;

                return [
                    'month' => $month->format('M'), // e.g. "Oct"
                    'value' => round($grouped->get($monthNum, 0), 2), // sum or 0
                ];
            })
            ->reverse() // oldest first
            ->values();

        $filteredGrnDetails = $grnDetails->filter(function ($item) use ($m) {
            if (empty($item->grn_date)) {
                return false;
            }

            // Parse "Oct 31 2025" → get month number
            $month = Carbon::createFromFormat('M d Y', $item->grn_date)->format('n');

            return $month == $m;
        });

        $topSuppliers = $filteredGrnDetails
            ->groupBy('supplier_id')
            ->map(function ($items, $supplierId) {
                $supplier = $items->first()->supplier;
                return [
                    'supplier_id' => $supplierId,
                    'supplier_name' => $supplier->supplier_code ?? '',
                    'sumAmount' => $items->sum('qty'),
                ];
            })
            ->sortByDesc('sumAmount')
            ->take(5) // only top 5
            ->values()
            ->map(function ($item, $index) use ($colorPalette) {
                // assign color AFTER sorting
                $item['color'] = $colorPalette[$index % count($colorPalette)];
                return $item;
            });

        $totalComingSoon = $filteredGrnDetails->where('grn_status_id', 1)->sum('qty');
        $totalReceived = $filteredGrnDetails->where('grn_status_id', 2)->sum('qty');

        // Return both in one response
        return response()->json([
            'totalReceived' => $totalReceived,
            'totalComingSoon' => $totalComingSoon,
            'delivery' => $delivery,
            'topSuppliers' => $topSuppliers,
        ]);
    }
    public function getDashboardAllocation($m,$y){
        $allocation = Inventory_allocation::with(['salesOrder'])
            ->whereNotNull('product_id')
            ->whereRelation('salesOrder', function ($query) use ($y) {
                $query->whereRaw('YEAR(STR_TO_DATE(so_date, "%b %d %Y")) = ?', [$y]);
            })->get();

        $colorPalette = [
            'bg-blue-500',
            'bg-purple-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-red-500',
        ];

        // Group and sum by month (using grn_date consistently)
        $grouped = $allocation
            ->groupBy(function ($item) {
                return $item->salesOrder 
                    ? Carbon::createFromFormat('M d Y', $item->salesOrder->so_date)->format('n') 
                    : null;
            })
            ->map(function ($items) {
                return $items->sum('qty');
            });

        // Build final array for the last 6 months (including current)
        $allocatedMonth = collect(range(0, 5)) // 0 = current month, 5 = 5 months ago
            ->map(function ($i) use ($grouped) {
                $month = Carbon::now()->subMonths($i);
                $monthNum = $month->month;

                return [
                    'month' => $month->format('M'), // e.g. "Oct"
                    'value' => round($grouped->get($monthNum, 0), 2), // sum or 0
                ];
            })
            ->reverse()
            ->values();


        $filteredAllocation = $allocation->filter(function ($item) use ($m) {
            if (!$item->salesOrder || empty($item->salesOrder->so_date)) {
                return false;
            }
            // Parse so_date like "Oct 31 2025" → extract month number
            $month = Carbon::createFromFormat('M d Y', $item->salesOrder->so_date)->format('n');
            return $month == $m;
        });

        $totalReceived = $filteredAllocation->sum('qty');
        $totalReceivedValue = $filteredAllocation->sum('qty');
        $totalAllocated = $filteredAllocation->sum('allocated_qty');

        $totalAllocatedPaid = Invoice_detail::where('product_type', 0)
            ->whereIn('invoice_status_id', [1, 3])
            ->whereRaw('YEAR(STR_TO_DATE(invoice_date, "%b %d %Y")) = ?', [$y])
            ->whereRaw('MONTH(STR_TO_DATE(invoice_date, "%b %d %Y")) = ?', [$m])
            ->sum('base_total');

        $totalAllocatedUnPaid = Sales_order_master::with('salesOrderDetails')
            ->where('invoice_status_id', 2)
            ->whereRaw('YEAR(STR_TO_DATE(so_date, "%b %d %Y")) = ?', [$y])
            ->whereRaw('MONTH(STR_TO_DATE(so_date, "%b %d %Y")) = ?', [$m])
            ->get()
            ->sum(function ($master) {
                return $master->salesOrderDetails
                    ->where('product_type', 0)
                    ->sum('base_total');
            });

        $invWithdraw = Inventory_allocation::with(['chartOfAccount'])
            ->whereYear('created_at', $y)
            ->whereMonth('created_at', $m)
            ->whereRaw('CHAR_LENGTH(account_no) > 1')
            ->get();

        $totalWithdraw = $invWithdraw->sum('qty');
        $invWithdrawGrouped = $invWithdraw
            ->groupBy('account_no') // now groupBy is collection method
            ->map(function ($items, $account_no) {
                return [
                    'account_no' => $account_no,
                    'account_name_en' => optional($items->first()->chartOfAccount)->account_name_en ?? '',
                    'account_name_cn' => optional($items->first()->chartOfAccount)->account_name_cn ?? '',
                    'count' => $items->sum('qty'),
                ];
            })
            ->values(); // reset array keys

        // Return both in one response
        return response()->json([
            'totalWithdraw' => number_format($totalWithdraw,0),
            'totalReceived' => number_format($totalReceived,0),
            'totalAllocated' => number_format($totalAllocated,0),
            'totalUnAllocated' => number_format($totalReceived - $totalAllocated,0),
            'totalAllocatedPaid' => $this->formatNumberShort($totalAllocatedPaid),
            'totalAllocatedUnPaid' => $this->formatNumberShort($totalAllocatedUnPaid),
            'allocatedMonth' => $allocatedMonth,
            'invWithdrawGrouped' => $invWithdrawGrouped,
        ]);
    }
    public function getDashboardShipout($m,$y){
        $shipOutItems = Shipout_items::with(['courier'])->whereYear('date', $y)->get();

        $totalReadyToShip = $shipOutItems->where('status',1)->sum('qty');
        $totalShipped = $shipOutItems->where('status',2)->sum('qty');

        $colorPalette = [
            'bg-blue-500',
            'bg-purple-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-red-500',
        ];

        // Group and sum by month (1–12)
        $grouped = $shipOutItems
            ->where('status', 2) // filter by status = 1
            ->groupBy(function ($item) {
                return Carbon::createFromFormat('Y-m-d', $item->date)->format('n'); // numeric month 1–12
            })
            ->map(function ($items) {
                return $items->sum('qty');
            });

        // Build final array with all months (Jan–Dec)
        $shippedMonthly = collect(range(0, 5))  // last 3 months (0=current, 1=last month, 2=2 months ago)
            ->map(function ($i) use ($grouped) {
                $month = Carbon::now()->subMonths($i);
                $monthNum = $month->month; // numeric month (1-12)
                return [
                    'month' => $month->format('M'), // e.g. "October"
                    'value' => round($grouped->get($monthNum, 0), 2), // get from grouped or 0 if missing
                ];
            })
            ->reverse() // optional: to get chronological order (oldest first)
            ->values();

        $topCourier = $shipOutItems
            ->whereNotNull('courier_id')
            ->groupBy('courier_id') // now groupBy is collection method
            ->map(function ($items, $courier_id) {
                return [
                    'courier_id' => $courier_id,
                    'courier_en' => optional($items->first()->courier)->courier_en ?? '',
                    'courier_cn' => optional($items->first()->courier)->courier_cn ?? '',
                    'count' => $items->sum('qty'),
                ];
            })
            ->values(); // reset array keys


        // Return both in one response
        return response()->json([
            'totalReadyToShip' => number_format($totalReadyToShip,0),
            'totalShipped' => number_format($totalShipped,0),
            'shippedMonthly' => $shippedMonthly,
            'topCourier' => $topCourier,
        ]);
    }
    public function getDashboardCustomer($m,$y){
        $customer = Customer::with(['countryList'])->get();

        $totalRetail = $customer->where('customer_type', 'RC')->count();
        $totalWholesale = $customer->where('customer_type', 'WC')->count();
        $totalInActive = $customer->where('status', 0)->count();
        $totalActive = $customer->where('status', 1)->count();

        $totalRetail_Pcnt = $this->cal_percentage($totalRetail,$customer->count());
        $totalWholesale_Pcnt = $this->cal_percentage($totalWholesale,$customer->count());
        $totalInActive_Pcnt = $this->cal_percentage($totalInActive,$customer->count());
        $totalActive_Pcnt = $this->cal_percentage($totalActive,$customer->count());

        $invMaster = Invoice_master::with(['customer'])
            ->where('invoice_status_id', 1)
            ->whereRaw(
                'YEAR(STR_TO_DATE(invoice_date, "%b %d %Y")) = ? AND MONTH(STR_TO_DATE(invoice_date, "%b %d %Y")) = ?',
                [$y, $m]
            )->orderByDesc('id')->get();

        $colorPalette = [
            'bg-blue-500',
            'bg-purple-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-red-500',
        ];

        $topCustomer = $invMaster
            ->filter(fn($item) => !empty($item->customer_id))
            ->groupBy(fn($item) => $item->customer_id)
            ->map(function ($items, $customer_id) use ($colorPalette) {
                $first = $items->first();
                $customer = $first->customer ?? null;
                return [
                    'customer_id' => $customer_id,
                    'customer_code' => $customer->customer_code ?? '',
                    'customer_name' => $customer->account_name_en ?? '',
                    'base_total' => $items->sum('base_total'),
                ];
            })
            ->sortByDesc('base_total')
            ->take(5)
            ->values()
            ->map(function ($item, $index) use ($colorPalette) {
                $item['color'] = $colorPalette[$index % count($colorPalette)];
                return $item;
            });

        $countryRanking = $customer
            ->filter(fn($item) => !empty($item->billing_country))
            ->groupBy(fn($item) => $item->billing_country)
            ->map(function ($items, $billing_country_id) {
                $first = $items->first();
                // defensive fallback if product/manufacturer missing on that first row
                $billing_country = $first->countryList ?? null;

                return [
                    'country_id' => $billing_country_id,
                    'country_code' => $billing_country->country_code ?? '',
                    'country_en' => $billing_country->country_en ?? '',
                    'country_cn' => $billing_country->country_cn ?? '',
                    'cnt' => $items->count('id'),
                ];
            })
            ->sortBy('billing_country_en')
            ->values();

        return response()->json([
            'totalRetail' => $totalRetail,
            'totalRetail_Pcnt' => $totalRetail_Pcnt,
            'totalWholesale' => $totalWholesale,
            'totalWholesale_Pcnt' => $totalWholesale_Pcnt,
            'totalInActive' => $totalInActive,
            'totalInActive_Pcnt' => $totalInActive_Pcnt,
            'totalActive' => $totalActive,
            'totalActive_Pcnt' => $totalActive_Pcnt,
            'topCustomer' => $topCustomer,
            'countryRanking' => $countryRanking,
        ]);
    }
    public function getDashboardSales($m,$y){
        $orders = Orders::with(['customer','product'])->where('show_category','orders')->whereRaw(
            'YEAR(STR_TO_DATE(order_date, "%b %d %Y")) = ?',[$y]
        )->get();

        $ordersByMonth = $orders->filter(fn($item) => Carbon::createFromFormat('M d Y', $item->order_date)->format('n') == $m);

        $webSales_total = $ordersByMonth->filter(fn($order) => $order->customer && $order->customer->customer_type === 'RC')->sum('base_total');
        $webSales_deposit = $ordersByMonth->filter(fn($order) => $order->customer && $order->customer->customer_type === 'RC')->sum('base_item_deposit');

        $wholesale_total = $ordersByMonth->filter(fn($order) => $order->customer && $order->customer->customer_type === 'WC')->sum('base_total');
        $wholesale_deposit = $ordersByMonth->filter(fn($order) => $order->customer && $order->customer->customer_type === 'WC')->sum('base_item_deposit');

        $totalConfirmed = $ordersByMonth->where('order_status', 1)->count();
        $totalConfirmed_total = $ordersByMonth->where('order_status', 1)->sum('base_total');
        $totalConfirmed_deposit = $ordersByMonth->where('order_status', 1)->sum('base_item_deposit');
        $totalUnconfirmed = $ordersByMonth->where('order_status', 2)->count();
        $totalUnconfirmed_total = $ordersByMonth->where('order_status', 2)->sum('base_total');
        $totalUnconfirmed_deposit = $ordersByMonth->where('order_status', 2)->sum('base_item_deposit');
        $totalNewUpdate = $ordersByMonth->where('order_status', 3)->count();
        $totalNewUpdate_total = $ordersByMonth->where('order_status', 3)->sum('base_total');

        $totalConfirmed_Pcnt = $this->cal_percentage($ordersByMonth->where('order_status', 1)->count(),$ordersByMonth->count());
        $totalUnconfirmed_Pcnt = $this->cal_percentage($ordersByMonth->where('order_status', 2)->count(),$ordersByMonth->count());
        $totalNewUpdate_Pcnt = $this->cal_percentage($ordersByMonth->where('order_status', 3)->count(),$ordersByMonth->count());

        $totalOrders = $ordersByMonth->sum('base_total');

        $colorPalette = [
            'bg-blue-500',
            'bg-purple-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-red-500',
        ];

        $salesByBrand = $ordersByMonth
            ->filter(fn($item) => !empty($item->product?->brand_id))
            ->groupBy(fn($item) => $item->product->brand_id)
            ->map(function ($items, $brand_id) {
                $first = $items->first();
                // defensive fallback if product/manufacturer missing on that first row
                $brand = $first->product->brand ?? null;

                return [
                    'brand_id' => $brand_id,
                    'brands_en' => $brand->brands_en ?? '',
                    'brands_cn' => $brand->brands_cn ?? '',
                    'base_total' => $items->sum('base_total'),
                ];
            })
            ->sortByDesc('base_total')
            ->take(5) // ✅ only top 5
            ->values()
            ->map(function ($item, $index) use ($colorPalette) {
                $item['color'] = $colorPalette[$index % count($colorPalette)];
                return $item;
            });

        $ordersArray = $ordersByMonth->map(function ($item) {
            return [
                'order_id' => $item->id,
                'order_status' => $item->order_status,
                'order_date' => $item->order_date ?? '',
                'customer_name' => $item->customer->account_name_en ?? '',
                'customer_type' => $item->customer->customer_type ?? '',
                'product_code' => $item->product->product_code ?? '',
                'product_title_en' => $item->product->product_title_en ?? '',
                'product_title_cn' => $item->product->product_title_cn ?? '',
                'qty' => $item->qty ?? 0,
                'base_total' => $item->base_total ?? 0,
            ];
        })->values(); // ensure it's a clean array index

        $topCustomer = $ordersByMonth
            ->filter(fn($item) => !empty($item->customer_id))
            ->groupBy(fn($item) => $item->customer_id)
            ->map(function ($items, $customerId) {
                $first = $items->first();
                $customer = $first->customer ?? null;
                return [
                    'customer_id' => $customerId,
                    'customer_code' => $customer->customer_code ?? '',
                    'customer_name' => $customer->account_name_en ?? '',
                    'base_total' => $items->sum('base_total'),
                ];
            })
            ->take(5)
            ->sortByDesc('base_total')
            ->values()
            ->map(function ($item, $index) use ($colorPalette) {
                $item['color'] = $colorPalette[$index % count($colorPalette)];
                return $item;
            });

        $topSalesPerson = $ordersByMonth
            ->filter(fn($item) => !empty($item->sales_person_id))
            ->groupBy(fn($item) => $item->sales_person_id)
            ->map(function ($items, $sales_person_id) {
                $first = $items->first();
                $customer = $first->salesPerson ?? null;
                return [
                    'sales_person_id' => $sales_person_id,
                    'customer_code' => $customer->full_name ?? '',
                    'base_total' => round($items->sum('base_total'), 2),
                ];
            })
            ->take(5)
            ->sortByDesc('base_total')
            ->values()
            ->map(function ($item, $index) use ($colorPalette) {
                $item['color'] = $colorPalette[$index % count($colorPalette)];
                return $item;
            });

        $statusLabels = [
            1 => 'Confirmed',
            2 => 'Unconfirmed',
            3 => 'New Update',
        ];
        $statusColors = [
            1 => 'bg-blue-500', // Confirmed
            2 => 'bg-yellow-500',  // Unconfirmed
            3 => 'bg-green-500',  // New Update
        ];

        $ordersByStatus = $ordersByMonth->groupBy('order_status')
            ->map(function ($group, $status) use ($statusLabels, $statusColors) {
                return [
                    'status' => $statusLabels[$status] ?? 'Unknown',
                    'total'  => $group->count(),
                    'color'  => $statusColors[$status] ?? 'gray',
                ];
            })->values(); // reindex numeric keys

        $months = [
            1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr',
            5 => 'May', 6 => 'Jun', 7 => 'Jul', 8 => 'Aug',
            9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Dec',
        ];

        $monthlyOrders = $orders->groupBy(function ($order) {
            return Carbon::createFromFormat('M d Y', $order->order_date)->format('n'); // numeric month
        })->map(function ($group, $monthNumber) {
            return [
                'month' => (int)$monthNumber, // we can convert to name later
                'total_qty' => $group->sum('qty'),
                'total_sales' => $group->sum('base_total'),
                'total_deposit' => $group->sum('base_item_deposit'),
            ];
        });

        $monthlyRevenue = [];
        foreach ($months as $num => $name) {
            $monthlyRevenue[] = $monthlyOrders[$num] ?? [
                'month' => $name,
                'total_qty' => 0,
                'total_sales' => 0,
                'total_deposit' => 0,
            ];
            // Replace numeric month with name if exists
            if (isset($monthlyRevenue[$num-1]['month']) && is_numeric($monthlyRevenue[$num-1]['month'])) {
                $monthlyRevenue[$num-1]['month'] = $name;
            }
        }

        $topProducts = $ordersByMonth
            ->filter(fn($item) => !empty($item->product_id))
            ->groupBy(fn($item) => $item->product_id)
            ->map(function ($items, $product_id) {
                $first = $items->first();
                $product = $first->product ?? null;
                return [
                    'product_id' => $product_id,
                    'product_code' => $product->product_code ?? '',
                    'product_title_en' => $product->product_title_en ?? '',
                    'product_title_cn' => $product->product_title_cn ?? '',
                    'brands_en' => $product->brand->brands_en ?? '',
                    'brands_cn' => $product->brand->brands_cn ?? '',
                    'qty' => $items->sum('qty'),
                    'base_total' => $items->sum('base_total'),
                ];
            })
            ->sortByDesc('base_total') // sort before taking top 5
            ->take(5)
            ->values()
            ->map(function ($item, $index) use ($colorPalette) {
                $item['color'] = $colorPalette[$index % count($colorPalette)];
                $item['rank'] = $index + 1; // add rank
                return $item;
            });


        return response()->json([
            'summary' => [
                'webSales_total' => $this->formatNumberShort($webSales_total),
                'webSales_deposit' => $this->formatNumberShort($webSales_deposit),
                'wholesale_total' => $this->formatNumberShort($wholesale_total),
                'wholesale_deposit' => $this->formatNumberShort($wholesale_deposit),
                'totalConfirmed' => $this->formatNumberShort($totalConfirmed),
                'totalConfirmed_Pcnt' => $this->formatNumberShort($totalConfirmed_Pcnt),
                'totalConfirmed_total' => $this->formatNumberShort($totalConfirmed_total),
                'totalConfirmed_deposit' => $this->formatNumberShort($totalConfirmed_deposit),
                'totalUnconfirmed' => $totalUnconfirmed,
                'totalUnconfirmed_Pcnt' => $this->formatNumberShort($totalUnconfirmed_Pcnt),
                'totalUnconfirmed_total' => $this->formatNumberShort($totalUnconfirmed_total),
                'totalUnconfirmed_deposit' => $this->formatNumberShort($totalUnconfirmed_deposit),
                'totalNewUpdate_Pcnt' => $this->formatNumberShort($totalNewUpdate_Pcnt),
                'totalNewUpdate_total' => $this->formatNumberShort($totalNewUpdate_total),
                'totalOrders' => $this->formatNumberShort($totalOrders),
            ],
            'salesByBrand' => $salesByBrand,
            'topCustomer' => $topCustomer,
            'topSalesPerson' => $topSalesPerson,
            'ordersByStatus' => $ordersByStatus,
            'monthlyRevenue' => $monthlyRevenue,
            'topProducts' => $topProducts,
        ]);
    }
    public function getDashboardPO($m,$y){
        $orders = Orders::with(['customer','product'])->where('show_category','orders')->whereRaw(
            'YEAR(STR_TO_DATE(order_date, "%b %d %Y")) = ?',[$y]
        )->get();

        $purchasesMaster = POrder_master::with(['supplier'])->whereRaw(
            'YEAR(STR_TO_DATE(po_date, "%b %d %Y")) = ?',[$y]
        )->get();

        $purchasesDetail = POrder_detail::with(['product'])
            ->whereNotNull('receive_date') // exclude null dates
            ->where('receive_date', '!=', '') // exclude empty strings
            ->whereRaw('MONTH(STR_TO_DATE(receive_date, "%b %d %Y")) = ?', [$m]) // month = 10 (October)
            ->whereRaw('YEAR(STR_TO_DATE(receive_date, "%b %d %Y")) = ?', [$y]) // year = 2025
            ->orderBy(DB::raw("STR_TO_DATE(receive_date, '%b %d %Y')"), 'desc') // sort by receive_date
            ->limit(20) // get only 20 records
            ->get();

        $apMaster = Accounts_payable_master::with(['supplier'])->whereRaw(
            'YEAR(STR_TO_DATE(ap_date, "%b %d %Y")) = ?',[$y]
        )->get();

        $pOrderMonth = $purchasesMaster->filter(fn($item) => Carbon::createFromFormat('M d Y', $item->po_date)->format('n') == $m);
        $ordersByMonth = $orders->filter(fn($item) => Carbon::createFromFormat('M d Y', $item->order_date)->format('n') == $m);

        $supplierCount = Supplier::count();
        $InvoiceCount = $apMaster->where('invoice_status_id', '!=', 5)->count();
        $InvoiceAmountPaid = $apMaster
            ->filter(fn($item) => Carbon::createFromFormat('M d Y', $item->ap_date)->format('n') == $m)
            ->where('invoice_status_id', 1)
            ->sum('base_sub_total');

        $InvoiceAmountUnpaid = $apMaster
            ->filter(fn($item) => Carbon::createFromFormat('M d Y', $item->ap_date)->format('n') == $m)
            ->where('invoice_status_id', 2)
            ->sum('base_sub_total');

        $POCount = $purchasesMaster->where('postatus_id', '!=', 5)->count();
        $POAmount = $purchasesMaster
            ->filter(fn($item) => Carbon::createFromFormat('M d Y', $item->po_date)->format('n') == $m)
            ->where('postatus_id', '!=', 5)
            ->sum('base_currency');

        $PODepositPaid = $purchasesMaster
            ->filter(fn($po) => 
                Carbon::createFromFormat('M d Y', $po->po_date)->format('n') == $m // filter by month
                && Carbon::createFromFormat('M d Y', $po->po_date)->format('Y') == $y // filter by year
                && $po->postatus_id != 5 // exclude canceled/closed POs
                && $po->details->contains(fn($d) => !empty($d->deposit_pv)) // has deposit_pv
            )
            ->sum('base_deposit');

        $PODepositNotPaid = $purchasesMaster
            ->filter(fn($po) => 
                Carbon::createFromFormat('M d Y', $po->po_date)->format('n') == $m // filter by month
                && $po->postatus_id != 5 // exclude canceled/closed POs
                && $po->details->every(fn($d) => strlen($d->deposit_pv ?? '') < 3) // all have deposit_pv length > 3
            )
            ->sum('base_deposit');

        $colorPalette = [
            'bg-yellow-500',
            'bg-red-500',
            'bg-green-500',
            'bg-blue-500',
            'bg-purple-500',
        ];

        $salesByBrand = $ordersByMonth
            ->filter(fn($item) => !empty($item->product?->brand_id))
            ->groupBy(fn($item) => $item->product->brand_id)
            ->map(function ($items, $brand_id) {
                $first = $items->first();
                // defensive fallback if product/manufacturer missing on that first row
                $brand = $first->product->brand ?? null;

                return [
                    'brand_id' => $brand_id,
                    'brands_en' => $brand->brands_en ?? '',
                    'brands_cn' => $brand->brands_cn ?? '',
                    'base_total' => $items->sum('base_total'),
                ];
            })
            ->sortByDesc('base_total')
            ->take(5) // ✅ only top 5
            ->values()
            ->map(function ($item, $index) use ($colorPalette) {
                $item['color'] = $colorPalette[$index % count($colorPalette)];
                return $item;
            });

        $topSupplier = $pOrderMonth
            ->filter(fn($item) => !empty($item->supplier_id))
            ->groupBy(fn($item) => $item->supplier_id)
            ->map(function ($items, $supplier_id) {
                $first = $items->first();
                $supplier = $first->supplier ?? null;
                return [
                    'supplier_id' => $supplier_id,
                    'supplier_code' => $supplier->supplier_code ?? '',
                    'supplier_name' => $supplier->suppliername_en ?? '',
                    'base_total' => $items->sum('base_currency'),
                ];
            })
            ->take(5)
            ->sortByDesc('base_total')
            ->values()
            ->map(function ($item, $index) use ($colorPalette) {
                $item['color'] = $colorPalette[$index % count($colorPalette)];
                return $item;
            });


        $colorMap = [
            1 => 'bg-green-500',
            2 => 'bg-blue-500',
            3 => 'bg-yellow-500',
            4 => 'bg-red-500',
        ];

        $topSalesPerson = $pOrderMonth
            ->filter(fn($item) => !empty($item->postatus_id))
            ->groupBy(fn($item) => $item->postatus_id)
            ->map(function ($items, $postatus_id) {
                $first = $items->first();
                $status = $first->invoiceStatus ?? null;
                return [
                    'postatus_id' => $postatus_id,
                    'postatus_en' => $status->postatus_en ?? '',
                    'postatus_cn' => $status->postatus_cn ?? '',
                    'count' => $items->count(),
                ];
            })
            ->take(5)
            ->sortByDesc('count')
            ->values()
            ->map(function ($item, $index) use ($colorMap) {
                $item['color'] = $colorMap[$item['postatus_id']] ?? 'bg-gray-500';
                return $item;
            });

        $months = [
            1 => 'Jan', 2 => 'Feb', 3 => 'Mar', 4 => 'Apr',
            5 => 'May', 6 => 'Jun', 7 => 'Jul', 8 => 'Aug',
            9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Dec',
        ];

        $monthlyOrders = $purchasesMaster->groupBy(function ($order) {
            return Carbon::createFromFormat('M d Y', $order->po_date)->format('n'); // numeric month
        })->map(function ($group, $monthNumber) {
            return [
                'month' => (int)$monthNumber, // we can convert to name later
                'total_count' => $group->count(),
                'total_sales' => $group->sum('base_currency'),
                'total_deposit' => $group->sum('base_deposit'),
            ];
        });

        $monthlyRevenue = [];
        foreach ($months as $num => $name) {
            $monthlyRevenue[] = $monthlyOrders[$num] ?? [
                'month' => $name,
                'total_count' => 0,
                'total_sales' => 0,
                'total_deposit' => 0,
            ];
            // Replace numeric month with name if exists
            if (isset($monthlyRevenue[$num-1]['month']) && is_numeric($monthlyRevenue[$num-1]['month'])) {
                $monthlyRevenue[$num-1]['month'] = $name;
            }
        }

        $topProducts = $purchasesDetail
            ->filter(fn($item) => !empty($item->product_id))
            ->groupBy(fn($item) => $item->product_id)
            ->map(function ($items, $product_id) {
                $first = $items->first();
                $product = $first->product ?? null;
                return [
                    'product_id' => $product_id,
                    'product_code' => $product->product_code ?? '',
                    'product_title_en' => $product->product_title_en ?? '',
                    'product_title_cn' => $product->product_title_cn ?? '',
                    'brands_en' => $product->brand->brands_en ?? '',
                    'brands_cn' => $product->brand->brands_cn ?? '',
                    'qty' => $items->sum('qty'),
                    'date' => $first->receive_date,
                ];
            })
            ->sortByDesc('base_total') // sort before taking top 5
            ->take(20)
            ->values()
            ->map(function ($item, $index) use ($colorPalette) {
                $item['color'] = $colorPalette[$index % count($colorPalette)];
                $item['rank'] = $index + 1; // add rank
                return $item;
            });

        return response()->json([
            'summary' => [
                'supplierCount' => $supplierCount,
                'POCount' => $POCount,
                'InvoiceCount' => $InvoiceCount,
                'InvoiceAmountPaid' => $this->formatNumberShort($InvoiceAmountPaid),
                'InvoiceAmountUnpaid' => $this->formatNumberShort($InvoiceAmountUnpaid),
                'POAmount' => $this->formatNumberShort($POAmount),
                'PODepositPaid' => $this->formatNumberShort($PODepositPaid),
                'PODepositNotPaid' => $this->formatNumberShort($PODepositNotPaid),
            ],
            'salesByBrand' => $salesByBrand,
            'topSupplier' => $topSupplier,
            'topSalesPerson' => $topSalesPerson,
            'monthlyRevenue' => $monthlyRevenue,
            'topProducts' => $topProducts,
        ]);
    }
    public function getDashboardSupplier($m,$y){
        $accPayable = Accounts_payable_master::with(['supplier'])->where('invoice_status_id',1)->whereRaw(
            'YEAR(STR_TO_DATE(ap_date, "%b %d %Y")) = ?',[$y]
        )->get();

        $colorPalette = [
            'bg-blue-500',
            'bg-purple-500',
            'bg-green-500',
            'bg-yellow-500',
            'bg-red-500',
        ];

        // Group and sum by month (1–12)
        $grouped = $accPayable
            ->groupBy(function ($item) {
                return Carbon::createFromFormat('M d Y', $item->ap_date)->format('n'); // numeric month 1–12
            })
            ->map(function ($items) {
                return $items->sum('base_sub_total');
            });

        // Build final array with all months (Jan–Dec)
        $purchases = collect(range(0, 5))  // last 3 months (0=current, 1=last month, 2=2 months ago)
            ->map(function ($i) use ($grouped) {
                $month = Carbon::now()->subMonths($i);
                $monthNum = $month->month; // numeric month (1-12)
                return [
                    'month' => $month->format('M'), // e.g. "October"
                    'value' => round($grouped->get($monthNum, 0), 2), // get from grouped or 0 if missing
                ];
            })
            ->reverse() // optional: to get chronological order (oldest first)
            ->values();

        $totalPurchases = $accPayable
            ->filter(fn($item) => Carbon::createFromFormat('M d Y', $item->ap_date)->format('n') == $m)
            ->sum('base_sub_total');

        $exclude = ['PO-211118-008','PO-210820-005','PO-210716-007'];

        $detailsQuery = POrder_detail::with([
            'product',
            'depositVoucher',
            'poMaster.supplier',
            'poMaster.bankList',
            'poMaster.creditSupplier'
        ])
        ->where('deposit', '>', 0)
        ->where('receive_qty', 0)
        ->whereNotIn('po_number', $exclude)
        ->whereHas('depositVoucher', function ($q) use ($m, $y) {
            $q->whereRaw('YEAR(STR_TO_DATE(pv_date, "%b %d %Y")) = ? AND MONTH(STR_TO_DATE(pv_date, "%b %d %Y")) = ?', [$y, $m]);
        })
        ->get();

        $totalDeposit = $detailsQuery->sum('base_deposit');

        $totalDepositOffset = $accPayable
            ->filter(fn($item) => 
                Carbon::createFromFormat('M d Y', $item->ap_date)->format('n') == $m && 
                $item->deposit > 0
            )
            ->sum('base_deposit');

        $allAccPayable = Accounts_payable_master::with(['supplier'])->where('invoice_status_id',1)->get();

        $topSuppliers = $allAccPayable
            ->groupBy('supplier_id')
            ->map(function ($items, $supplierId) {
                $supplier = $items->first()->supplier;
                return [
                    'supplier_id' => $supplierId,
                    'supplier_name' => $supplier->supplier_code ?? '',
                    'sumAmount' => $items->sum('base_sub_total'),
                ];
            })
            ->sortByDesc('sumAmount')
            ->take(5) // only top 5
            ->values()
            ->map(function ($item, $index) use ($colorPalette) {
                // assign color AFTER sorting
                $item['color'] = $colorPalette[$index % count($colorPalette)];
                return $item;
            });

        $totalSuppliers = Supplier::count();

        return response()->json([
            'purchases' => $purchases,
            'totalPurchases' => $this->formatNumberShort($totalPurchases),
            'totalDeposit' => $this->formatNumberShort($totalDeposit),
            'totalDepositOffset' => $this->formatNumberShort($totalDepositOffset),
            'topSuppliers' => $topSuppliers,
            'totalSuppliers' => $totalSuppliers,
            'accountsPayable' => $this->getAccountsPayable(),
        ]);
    }
    public function getAccountsPayable(){
        $builder = DB::table('t_grn_detail as a')
            ->leftJoin('t_ap_detail as b', function ($join) {
                $join->on('b.product_id', '=', 'a.product_id')
                    ->on('b.po_number', '=', 'a.po_number');
            })
            ->leftJoin('t_ap_master as c', 'c.ap_number', '=', 'b.ap_number')
            ->join('m_suppliers as d', 'd.id', '=', 'a.supplier_id')
            ->join('t_grn_master as e', 'e.grn_no', '=', 'a.grn_no')
            ->leftJoin('t_porder_detail as f', function ($join) {
                $join->on('f.po_number', '=', 'a.po_number')
                    ->on('f.product_id', '=', 'a.product_id');
            })
            ->leftJoin('m_products as g', 'g.id', '=', 'a.product_id')
            ->select([
                DB::raw("FLOOR(RAND() * 1000000) AS index_id"),
                DB::raw("GROUP_CONCAT(a.id SEPARATOR ',') AS id"),
                DB::raw("MAX(a.supplier_id) AS supplier_id"),
                DB::raw("MAX(d.supplier_code) AS supplier_code"),
                DB::raw("MAX(d.suppliername_en) AS suppliername_en"),
                DB::raw("MAX(d.suppliername_cn) AS suppliername_cn"),
                'a.grn_no',
                DB::raw("MAX(a.currency) AS currency"),
                DB::raw("MAX(a.ex_rate) AS ex_rate"),
                DB::raw("MAX(a.ap_invoice_no) AS ap_number"),
                DB::raw("MAX(a.grn_date) AS grn_date"),
                DB::raw("MAX(DATE_FORMAT(STR_TO_DATE(a.grn_date, '%M %d %Y'), '%Y-%m-%d')) AS grn_dateNumber"),
                DB::raw("MAX(COALESCE(c.due_date, '')) AS due_date"),
                DB::raw("MAX(COALESCE(c.invoice_status_id, 0)) AS invoice_status_id"),
                DB::raw("COALESCE(SUM(f.deposit), 0) AS deposit"),
                DB::raw("COALESCE(SUM(f.base_deposit), 0) AS base_deposit"),
                DB::raw("SUM(a.total) AS total"),
                DB::raw("SUM(a.base_total) AS base_total"),
            ])
            ->whereRaw("COALESCE(c.invoice_status_id, 0) <> 1")
            ->whereNotNull('a.product_id')
            ->whereRaw("COALESCE(a.total, 0) - COALESCE(f.deposit, 0) > 0")
            ->where('e.grn_status_id', 2)
            ->where('a.imported', 0)
            ->groupBy('a.grn_no')
            ->orderByDesc('a.grn_no');

        $groupedResults = $builder->get();

        // Extract all IDs
        $allIds = $groupedResults->pluck('id')
            ->map(fn($ids) => explode(',', $ids))
            ->flatten()
            ->map(fn($id) => (int) $id)
            ->all();

        // Fetch item details
        $details = DB::table('t_grn_detail as a')
            ->leftJoin('t_ap_detail as b', function ($join) {
                $join->on('b.product_id', '=', 'a.product_id')
                    ->on('b.po_number', '=', 'a.po_number');
            })
            ->leftJoin('t_porder_detail as f', function ($join) {
                $join->on('f.po_number', '=', 'a.po_number')
                    ->on('f.product_id', '=', 'a.product_id');
            })
            ->join('m_products as g', 'g.id', '=', 'a.product_id')
            ->select([
                'a.id',
                'a.grn_no',
                'a.product_id',
                'g.product_code',
                'g.product_title_en',
                'g.product_title_cn',
                'a.total',
                'a.base_total',
                'a.currency',
                'a.qty',
                'a.price',
                'f.deposit',
                'f.base_deposit',
            ])
            ->whereIn('a.id', $allIds)
            ->get()
            ->groupBy('grn_no');

        // Attach details only
        $groupedResults = $groupedResults->map(function ($item) use ($details) {
            $item->details = $details->get($item->grn_no, collect())->values();
            return $item;
        });

        return $groupedResults;
    }
    public function cal_percentage($num_amount, $num_total) {
        if($num_amount != 0){
            $count1 = $num_amount / $num_total;
            $count2 = $count1 * 100;
            $count = number_format($count2, 0);
            return $count;
        }
        else{
            return 0;
        }
    }
    public function getDashboardAccounts($m, $y){
        // ===== INVOICES =====
        $invMaster = Invoice_master::with('customer')
            ->whereRaw('YEAR(STR_TO_DATE(invoice_date, "%b %d %Y")) = ?', [$y])
            ->get();

        $soMaster = Sales_order_master::with('customer')
            ->whereRaw('YEAR(STR_TO_DATE(so_date, "%b %d %Y")) = ?', [$y])
            ->get();

        // ===== COGS =====
        $generalLedgerCOGS = General_ledger::where('account_code', 21604)
            ->whereRaw('YEAR(STR_TO_DATE(transaction_date, "%b %d %Y")) = ?', [$y])
            ->get();

        $groupedCOGS = $invMaster
            ->where('invoice_status_id', 1)
            // ->filter(fn($item) => Carbon::createFromFormat('M d Y', $item->invoice_date)->format('n') == $m)
            ->groupBy(fn($item) => Carbon::createFromFormat('M d Y', $item->invoice_date)->format('n'))
            ->map(fn($items) => $items->sum('sub_total_on_cost'));

        $groupedLedgerCOGS = $generalLedgerCOGS
            // ->filter(fn($item) => Carbon::createFromFormat('M d Y', $item->transaction_date)->format('n') == $m)
            ->groupBy(fn($item) => Carbon::createFromFormat('M d Y', $item->transaction_date)->format('n'))
            ->map(fn($items) => $items->sum('debit'));

        // ===== EXPENSES =====
        $pvDetail = Payment_voucher_detail::with('product')
            ->where('account_code', 'LIKE', '6%')
            ->whereRaw('YEAR(STR_TO_DATE(pv_date, "%b %d %Y")) = ?', [$y])
            ->get();

        $groupedExpenses = $pvDetail
            // ->filter(fn($item) => Carbon::createFromFormat('M d Y', $item->pv_date)->format('n') == $m)
            ->groupBy(fn($item) => Carbon::createFromFormat('M d Y', $item->pv_date)->format('n'))
            ->map(fn($items) => $items->sum('base_amount'));

        // ===== INCOME =====
        $ledgerIncome = General_ledger::whereIn('account_code', [70002, 70001])
            ->whereRaw('YEAR(STR_TO_DATE(transaction_date, "%b %d %Y")) = ?', [$y])
            ->get() // ✅ now we have a Collection
            ->filter(fn($item) => Carbon::createFromFormat('M d Y', $item->transaction_date)->format('n') == $m);

        $groupedIncomeInvoices = $invMaster
            ->where('invoice_status_id', 1)
            // ->filter(fn($item) => Carbon::createFromFormat('M d Y', $item->invoice_date)->format('n') == $m)
            ->groupBy(fn($item) => Carbon::createFromFormat('M d Y', $item->invoice_date)->format('n'))
            ->map(fn($items) => $items->sum('base_total'));

        $groupedIncomeLedger = $ledgerIncome
            // ->filter(fn($item) => Carbon::createFromFormat('M d Y', $item->transaction_date)->format('n') == $m)
            ->groupBy(fn($item) => Carbon::createFromFormat('M d Y', $item->transaction_date)->format('n'))
            ->map(fn($items) => $items->sum('credit'));

        // ===== MERGE INTO CHART FORMAT =====
        $chartData = collect(range(1, 12))->map(function ($month) use (
            $groupedCOGS,
            $groupedLedgerCOGS,
            $groupedExpenses,
            $groupedIncomeInvoices,
            $groupedIncomeLedger
        ) {
            $monthName = Carbon::create()->month($month)->format('M');

            $cost = round($groupedCOGS->get($month, 0) + $groupedLedgerCOGS->get($month, 0), 2);
            $expenses = round($groupedExpenses->get($month, 0), 2);
            $income = round($groupedIncomeInvoices->get($month, 0) + $groupedIncomeLedger->get($month, 0), 2);

            return [
                'month' => $monthName,
                'monthNum' => $month,
                'income' => $income,
                'expenses' => $expenses,
                'cost' => $cost,
            ];
        });

        // ===== OTHER TOTALS (unchanged from your original) =====
        $rvMaster = Receive_voucher_master::with('customer')
            ->where('account_code', 21301)
            ->where('rv_status_id', '<>', 5)
            ->whereRaw('YEAR(STR_TO_DATE(rv_date, "%b %d %Y")) = ? AND MONTH(STR_TO_DATE(rv_date, "%b %d %Y")) = ?', [$y, $m])
            ->get();

        $generalEntries = General_entries::where('account_code', 21301)
            ->whereRaw('YEAR(STR_TO_DATE(transaction_date, "%b %d %Y")) = ? AND MONTH(STR_TO_DATE(transaction_date, "%b %d %Y")) = ?', [$y, $m])
            ->get();

        $depositReceived = $rvMaster->sum('base_amount_paid') + $generalEntries->sum('base_amount');

        $depositOffsetCustomer = $invMaster
            ->filter(fn($item) => Carbon::createFromFormat('M d Y', $item->invoice_date)->format('m') == $m)
            ->sum('base_total_deposit');

        $advancePayment = General_ledger::where('account_code', 21312)
            ->whereRaw('YEAR(STR_TO_DATE(transaction_date, "%b %d %Y")) = ? AND MONTH(STR_TO_DATE(transaction_date, "%b %d %Y")) = ?', [$y, $m])
            ->sum('credit');

        $accPayable = Accounts_payable_master::with('supplier')
            ->where('invoice_status_id', 1)
            ->whereRaw('YEAR(STR_TO_DATE(ap_date, "%b %d %Y")) = ?', [$y])
            ->get();

        $depositOffsetSupplier = $accPayable
            ->filter(fn($item) =>
                Carbon::createFromFormat('M d Y', $item->ap_date)->format('n') == $m && $item->deposit > 0
            )
            ->sum('base_deposit');

        $AgingInvoices = $invMaster
            ->filter(fn($item) => Carbon::createFromFormat('M d Y', $item->invoice_date)->format('m') == $m)
            ->whereNotNull('customer_id')
            ->whereIn('invoice_status_id', [2, 3]) // ✅ Filter existing collection
            ->map(function ($invoice) {
                $invoiceDate = !empty($invoice->invoice_date)
                    ? Carbon::createFromFormat('M d Y', $invoice->invoice_date)
                    : null;

                return [
                    'invoice_no'     => $invoice->invoice_no,
                    'invoice_date'   => $invoice->invoice_date,
                    'base_total'     => round($invoice->base_total, 2),
                    'age'            => $invoiceDate ? $invoiceDate->diffInDays(Carbon::now()) : null,
                    'customer_code'  => $invoice->customer->customer_code ?? null,
                    'customer_name'  => $invoice->customer->account_name_en ?? null,
                ];
            })
            ->sortByDesc('age') // ✅ Sort by computed 'age'
            ->values(); // optional: reindex array

        $AgingSalesOrder = $soMaster
            ->filter(fn($item) => Carbon::createFromFormat('M d Y', $item->so_date)->format('m') == $m)
            ->whereNotNull('customer_id')
            ->whereIn('invoice_status_id', [2, 3]) // ✅ Filter existing collection
            ->map(function ($invoice) {
                $invoiceDate = !empty($invoice->so_date)
                    ? Carbon::createFromFormat('M d Y', $invoice->so_date)
                    : null;

                return [
                    'invoice_no'     => $invoice->so_number,
                    'invoice_date'   => $invoice->so_date,
                    'base_total'     => round($invoice->base_total, 2),
                    'age'            => $invoiceDate ? $invoiceDate->diffInDays(Carbon::now()) : null,
                    'customer_code'  => $invoice->customer->customer_code ?? null,
                    'customer_name'  => $invoice->customer->account_name_en ?? null,
                ];
            })
            ->sortByDesc('age') // ✅ Sort by computed 'age'
            ->values(); // optional: reindex array

        $accountsReceivable = $invMaster
            ->filter(fn($item) => Carbon::createFromFormat('M d Y', $item->invoice_date)->format('m') == $m)
            ->whereIn('invoice_status_id',[2,3])
            ->sum(fn($item) => $item->base_sub_total - $item->base_total_deposit - $item->base_credit_used - ($item->payment * $item->ex_rate));


        $accountsPayable = $this->getAccountsPayable(); // assuming this returns a Collection
        $accountsPayableFiltered = $accountsPayable->filter(function($item) use ($m, $y) {
            $date = Carbon::createFromFormat('M d Y', $item->grn_date);
            return $date->month == $m && $date->year == $y;
        });
        $chartDataByMonth = $chartData->filter(fn($item) => $item['monthNum'] == $m);

        $colorPalette = [
            'bg-rose-500',      // pink-red
            'bg-fuchsia-500',   // bright pink
            'bg-lime-500',      // lime green
            'bg-amber-500',     // yellow-orange
            'bg-emerald-500',   // green
            'bg-cyan-500',      // cyan
            'bg-violet-500',    // violet
            'bg-orange-500',    // orange
            'bg-sky-500',       // sky blue
            'bg-indigo-500',    // indigo
        ];

        $groupedExpensesByAccount = $pvDetail
            ->groupBy('account_code')
            ->map(function ($items, $account_code) {
                $first = $items->first();
                $chart = $first->chartOfAccount;
                return [
                    'account_code' => $account_code,
                    'account_name_en' => $chart->account_name_en ?? '',
                    'account_name_cn' => $chart->account_name_cn ?? '',
                    'total_base_amount' => $items->sum('base_amount'),
                ];
            })
            ->sortByDesc('total_base_amount')
            ->values()
            ->map(function ($item, $index) use ($colorPalette) {
                // assign color AFTER sorting
                $item['color'] = $colorPalette[$index] ?? null;
                return $item;
            });

        // ===== FINAL RESPONSE =====
        return response()->json([
            'revenue' => $chartData,
            'summary' => [
                'totalIncome' => $this->formatNumberShort($chartDataByMonth->sum('income')),
                'totalExpenses' => $this->formatNumberShort($chartDataByMonth->sum('expenses')),
                'totalCost' => $this->formatNumberShort($chartDataByMonth->sum('cost')),
                'netProfit' => $this->formatNumberShort($chartDataByMonth->sum('income') - ($chartDataByMonth->sum('expenses') + $chartDataByMonth->sum('cost'))),
                'averageProfitMargin' => round(
                    $chartDataByMonth->sum('income') > 0
                        ? (($chartDataByMonth->sum('income') - ($chartDataByMonth->sum('expenses') + $chartDataByMonth->sum('cost')))
                            / $chartDataByMonth->sum('income')) * 100
                        : 0,
                    2
                ),
                'depositReceived' => $this->formatNumberShort($depositReceived),
                'depositOffsetCustomer' => $this->formatNumberShort($depositOffsetCustomer),
                'advancePayment' => $this->formatNumberShort($advancePayment),
                'depositOffsetSupplier' => $this->formatNumberShort($depositOffsetSupplier),
                'accountsReceivable' => $this->formatNumberShort($accountsReceivable),
                'accountsPayableTotal' => $this->formatNumberShort($accountsPayableFiltered->sum('base_total')),
                'depositPaidSupplier' => $this->formatNumberShort($accountsPayableFiltered->sum('base_deposit')),
            ],
            'accountsPayable' => $accountsPayableFiltered,
            'AgingInvoices' => $AgingInvoices,
            'AgingSalesOrder' => $AgingSalesOrder,
            'groupedExpensesByAccount' => $groupedExpensesByAccount,
        ]);
    }
    public function formatNumberShort($number) {
        if ($number >= 1_000_000_000) {
            return number_format($number / 1_000_000_000, 2) . 'B';
        } elseif ($number >= 1_000_000) {
            return number_format($number / 1_000_000, 2) . 'M';
        } elseif ($number >= 1_000) {
            return number_format($number / 1_000, 2) . 'K';
        } else {
            return number_format($number, 2);
        }
    }
}