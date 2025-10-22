<?php

namespace App\Http\Controllers;
use Carbon\Carbon;

use App\Models\Shipout_items;
use App\Models\Products;
use App\Models\Orders;
use App\Models\Forex;
use App\Models\Currencies;

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
}
