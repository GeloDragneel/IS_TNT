<?php

namespace App\Http\Controllers;

use App\Models\ISSettings;
use App\Models\Customer;
use App\Models\Credit_note_customer;
use App\Models\Credit_note_customer_detail;
use App\Models\Accounting_settings;

use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

use App\Events\CustomerEvent;

class CustomerCreditNoteController extends Controller{

    public function getAllCustomerCreditNote(Request $request){
        $perPage = (int) $request->input('per_page', 15);
        $page = (int) $request->input('page', 1);
        $search = $request->input('search', '');
        $customerCodes = $request->input('customer_codes', []);
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $categoryDates = $request->input('category_dates');

        // Base query with eager loading
        $query = Credit_note_customer::with([
            'customer:id,account_name_en,account_name_cn,customer_code',
            'details.product:id,product_code,product_title_en,product_title_cn',
            'details.account:id,account_code,account_name_en,account_name_cn',
            'detailsCopy.product:id,product_code,product_title_en,product_title_cn',
            'detailsCopy.account:id,account_code,account_name_en,account_name_cn',
            'invoiceStatus:id,status_value_en,status_value_cn',
        ])->orderByDesc('id');


        // Filters
        if (!empty($customerCodes)) {
            $query->whereIn('customer_id', $customerCodes);
        }
        if ($categoryDates === 'Date' && $dateFrom && $dateTo) {
            $query->whereBetween(DB::raw("STR_TO_DATE(cr_date, '%b %d %Y')"), [$dateFrom, $dateTo]);
        }
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('cr_number', 'like', "%{$search}%")
                    ->orWhereHas('invoiceStatus', function ($q) use ($search) {
                        $q->where('status_value_en', 'like', "%{$search}%")
                            ->orWhere('status_value_cn', 'like', "%{$search}%");
                    })
                    ->orWhereHas('details.product', function ($q) use ($search) {
                        $q->where('product_code', 'like', "%{$search}%")
                            ->orWhere('account_code', 'like', "%{$search}%")
                            ->orWhere('product_title_en', 'like', "%{$search}%")
                            ->orWhere('product_title_cn', 'like', "%{$search}%");
                    })
                    ->orWhereHas('detailsCopy.product', function ($q) use ($search) {
                        $q->where('product_code', 'like', "%{$search}%")
                            ->orWhere('account_code', 'like', "%{$search}%")
                            ->orWhere('product_title_en', 'like', "%{$search}%")
                            ->orWhere('product_title_cn', 'like', "%{$search}%");
                    });
            });
        }

        // Clone query to get all data for footer totals
        $allData = (clone $query)->get();

        // Transform all orders
        $allDataTransformed = $allData->map(fn($order) => $this->transformOrderData($order));

        $currencyOrder = ['RMB', 'SG$', 'BASE_RMB', 'US$'];

        // Footer2 totals for all records, including 0 if no orders
        $groupedTotals = $allDataTransformed->groupBy('currency')
            ->map(fn($items, $currency) => [
                'currency' => $currency,
                'total' => $items->sum('amount'),
            ]);

        // Build footer2 in fixed order
        $footer2 = collect($currencyOrder)->map(fn($currency) => [
            'currency' => $currency,
            'total' => $currency === 'BASE_RMB'
                ? $allDataTransformed->sum('base_amount')
                : ($groupedTotals->get($currency)['total'] ?? 0),
        ])->values();

        // Pagination
        $result = $perPage === -1 ? $query->get() : $query->paginate($perPage);

        // Transform paginated data
        if ($perPage === -1) {
            $paginatedData = $result->map(fn($item) => $this->transformOrderData($item));
        } else {
            $paginatedData = $result->getCollection()->map(fn($item) => $this->transformOrderData($item));
            $result->setCollection($paginatedData);
        }

        // Return JSON
        return response()->json([
            'success' => true,
            'message' => 'success',
            'list' => [
                'current_page' => $result instanceof LengthAwarePaginator ? $result->currentPage() : 1,
                'data' => $paginatedData,
                'footer2' => $footer2,
                'last_page' => $result instanceof LengthAwarePaginator ? $result->lastPage() : 1,
                'per_page' => $result instanceof LengthAwarePaginator ? $result->perPage() : $paginatedData->count(),
                'total' => $result instanceof LengthAwarePaginator ? $result->total() : $paginatedData->count(),
            ]
        ]);
    }
    public function getCRInfo($id){
        $list = Credit_note_customer::with([
            'customer',
            'details.product',
            'details.account',
            'detailsCopy.product',
            'detailsCopy.account',
        ])->where('id', $id)->first();

        if (!$list) {
            return [];
        }

        $account_name_en = $list->customer->account_name_en ?? '';
        $account_name_cn = $list->customer->account_name_cn ?? '';
        $account_name_cn = $account_name_cn === '' ? $account_name_en : $account_name_cn;

        $billing_address_en = $list->customer->billing_address_en ?? '';
        $billing_address_cn = $list->customer->billing_address_cn ?? '';
        $billing_address_cn = $billing_address_cn === '' ? $billing_address_en : $billing_address_cn;

        $delivery_address_en = $list->customer->delivery_address_en ?? '';
        $delivery_address_cn = $list->customer->delivery_address_cn ?? '';
        $delivery_address_cn = $delivery_address_cn === '' ? $delivery_address_en : $delivery_address_cn;

        $currency = $list->currency;
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        $operator = GlobalController::getOperator( $currency . $baseCurrency);

        $mergedDetailsModels = $list->details->merge($list->detailsCopy);

        // Map merged collection to arrays
        $mergedDetails = $mergedDetailsModels->map(function ($detail) {
            $product_code = optional($detail->product)->product_code;
            $product_title_en = optional($detail->product)->product_title_en;
            $product_title_cn = optional($detail->product)->product_title_cn;
            $account_name_en = optional($detail->account)->account_name_en;
            $account_name_cn = optional($detail->account)->account_name_cn;
            return [
                'id'                    => $detail->id,
                'product_id'            => $detail->product_id ?? 0,
                'product_code'          => $product_code,
                'product_title_en'      => $product_title_en,
                'product_title_cn'      => $product_title_cn,
                'account_name_en'       => $account_name_en,
                'account_name_cn'       => $account_name_cn,
                'cr_number'             => $detail->cr_number,
                'amount'                => $detail->amount,
                'base_amount'           => $detail->base_amount,
                'currency'              => $detail->currency,
                'ex_rate'               => $detail->ex_rate,
                'particulars'           => $detail->particulars,
                'customer_id'           => $detail->customer_id,
                'account_code'          => $detail->account_code,
                'order_id'              => $detail->order_id,
                'is_deleted'            => 0,
                'indexInt'              => $detail->id . rand(1, 100),
                'age_type'              => 'old',
                'delete_type'           => '',
            ];
        })->values();

        $particulars_en = "";
        $particulars_cn = "";

        if($list->particulars != ''){
            $particulars = explode('~', $list->particulars);
            $particulars_en = $particulars[0]; 
            $particulars_cn = $particulars[1];
        }

        $list = [
            'id'                    => $list->id,
            'customer_id'           => $list->customer_id,
            'customer_code'         => $list->customer->customer_code ?? '',
            'account_name_en'       => $account_name_en,
            'account_name_cn'       => $account_name_cn,
            'billing_address_en'    => $billing_address_en,
            'billing_address_cn'    => $billing_address_cn,
            'operator'              => $operator,
            'particulars_en'        => $particulars_en,
            'particulars_cn'        => $particulars_cn,
            'amount'                => $list->amount,
            'base_amount'           => $list->base_amount,
            'ex_rate'               => $list->ex_rate,
            'cr_number'             => $list->cr_number,
            'cr_date'               => $list->cr_date,
            'cr_status_id'          => $list->cr_status_id,
            'account_code'          => $list->account_code,
            'currency'              => $list->currency,
            'details'               => $mergedDetails,
        ];
        return response()->json([
            'success' => true,
            'message' => 'success',
            'list'    => $list,
        ]);
    }
    private function transformOrderData($list){
        $customer = optional($list->customer);
        $customer_name_en = $customer->account_name_en ?? '';
        $customer_name_cn = $customer->account_name_cn ?: $customer_name_en;
        $details = ($list->cr_status_id == 5) ? $list->detailsCopy : $list->details;
        
        return [
            'id' => $list->id,
            'cr_number' => $list->cr_number,
            'cr_date' => $list->cr_date,
            'customer_id' => $list->customer_id,
            'currency' => $list->currency,
            'ex_rate' => $list->ex_rate,
            'amount' => $list->amount,
            'base_amount' => $list->base_amount,
            'cr_status_id' => $list->cr_status_id,
            'status_value_en' => optional($list->invoiceStatus)->status_value_en,
            'status_value_cn' => optional($list->invoiceStatus)->status_value_cn,
            'customer_code' => $customer->customer_code,
            'account_name_en' => $customer_name_en,
            'account_name_cn' => $customer_name_cn,
            'details' => $details->map(function ($detail) {
                $product = optional($detail->product);
                $account = optional($detail->account);
                
                $product_code = $product->product_code ?? '';
                $product_title_en = $product->product_title_en ?? '';
                $product_title_cn = $product->product_title_cn ?: $product_title_en;

                $account_name_en = $account->account_name_en ?? '';
                $account_name_cn = $account->account_name_cn ?: $account_name_en;

                return [
                    'id' => $detail->id,
                    'account_code' => $detail->account_code,
                    'account_name_en' => $account_name_en,
                    'account_name_cn' => $account_name_cn,
                    'particulars' => $detail->particulars,
                    'amount' => $detail->amount,
                    'base_amount' => $detail->base_amount,
                    'currency' => $detail->currency,
                    'product_id' => $detail->product_id,
                    'ex_rate' => $detail->ex_rate,
                    'product_code' => $product_code,
                    'product_title_en' => $product_title_en,
                    'product_title_cn' => $product_title_cn,
                ];
            })->values(),
        ];
    }
    public function voidCustomerCreditNote(Request $request){
        DB::beginTransaction();

        try {
            if (!$request->has('details') || empty($request->details)) {
                return response()->json([
                    'token'   => 'Error',
                    'message' => 'No details found.',
                    'action'  => 'update'
                ]);
            }

            foreach ($request->details as $list) {
                // Ensure $list is an array (in case it's a JSON string)
                if (is_string($list)) {
                    $list = json_decode($list, true);
                }

                if (!is_array($list) || !isset($list['cr_number'])) {
                    throw new \Exception('Invalid detail format.');
                }

                $cr_number = $list['cr_number'];

                $cr = Credit_note_customer::where('cr_number', $cr_number)->first();
                if ($cr) {
                    $cr->cr_status_id = 5;
                    $cr->save(); // ✅ This will fire `updated()` in the observer
                }
                // Call logAction from a service, not controller
                $globalController = new GlobalController();
                $globalController->logAction(
                    'Credit Note (Customer)',
                    't_credit_note_customer_master',
                    'void',
                    'Void CR Number: ' . $cr_number
                );
            }

            DB::commit();

            return response()->json([
                'token'   => 'Success',
                'message' => 'Successfully Voided',
                'action'  => 'update'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'token'   => 'Error',
                'message' => $e->getMessage(),
                'action'  => 'update'
            ]);
        }
    }
    public function getCountExistCustomer($customer_code){
        return Customer::where('customer_code', $customer_code)->count();
    }
    public function updateCustCreditNote(Request $request, $id){

        $OrigID = $id;
        $GlobalTableNo = '';
        $Action = ($OrigID === 0 ? 'insert' : 'update');

        $countCustomer = $this->getCountExistCustomer($request->customer_code);
        if($countCustomer === 0){
            return response()->json([
                'token'     => 'Warning',
                'message'   => 'Customer Account does not exist',
                'id'        => $id,
                'action'    => $Action
            ]);
        }

        if($request->ex_rate === 0){
            return response()->json([
                'token'     => 'Warning',
                'message'   => 'Exchange Rate is Required',
                'action'    => 'Insert'
            ]);
        }

        DB::beginTransaction();

        try {

            $currency = $request->currency;
            $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
            $operator = GlobalController::getOperator( $currency . $baseCurrency);

            $particulars = $request->particulars_en . '~' . $request->particulars_cn;
            $account_code = Accounting_settings::where('chart_fix_code', 'CRCUST')->value('account_code');

            if ((int) $id === 0) {
                $AutoGenerated = new AutoGenerated();
                $cr_number = $AutoGenerated->getNextNo("cr_number","CR","t_credit_note_customer_master");
                $inserMaster = [
                    'cr_number' => $cr_number,
                    'cr_date' => $request->cr_date,
                    'customer_id' => $request->customer_id,
                    'currency' => $request->currency,
                    'ex_rate' => $request->ex_rate,
                    'amount' => $request->amount,
                    'base_amount' => $request->base_amount,
                    'cr_status_id' => $request->cr_status_id,
                    'particulars' => $particulars,
                    'account_code' => $account_code,
                ];
                $master = Credit_note_customer::create($inserMaster);
                $OrigID = $master->id;
                $GlobalTableNo = $cr_number;
            }
            else{
                $master = Credit_note_customer::find($request['id']);
                if ($master) {
                    $master->cr_date = $request->cr_date;
                    $master->customer_id = $request->customer_id;
                    $master->currency = $request->currency;
                    $master->ex_rate = $request->ex_rate;
                    $master->amount = $request->amount;
                    $master->base_amount = $request->base_amount;
                    $master->cr_status_id = $request->cr_status_id;
                    $master->particulars = $particulars;
                    $master->account_code = $account_code;
                    $master->save();
                }
                $GlobalTableNo = $master->cr_number;
            }
            if ($request->has('details')) {
                foreach ($request->details as $list) {
                    if (is_string($list)) {
                        $list = json_decode($list, true);
                    }
                    $recordID = $list['id'];
                    $detail_id = 0;
                    if ((int) $list['is_deleted'] === 1) {
                        $detail = Credit_note_customer_detail::find($recordID);
                        if ($detail) {
                            $detail->delete();
                        }
                    }
                    if((int) $list['is_deleted'] === 0){
                        if ((int) $recordID === 0) {
                            $insertDetail = [
                                'cr_number' => $GlobalTableNo,
                                'cr_date' => $request->cr_date,
                                'account_code' => $list['account_code'],
                                'particulars' => $list['particulars'],
                                'currency' => $request->currency,
                                'ex_rate' => $request->ex_rate,
                                'amount' => $list['amount'],
                                'base_amount' => $list['base_amount'],
                                'customer_id' => $request->customer_id,
                                
                            ];
                            $detail = Credit_note_customer_detail::create($insertDetail);
                            $detail_id = $detail->id;
                        }
                        else{
                            $detail = Credit_note_customer_detail::find($recordID);
                            if ($detail) {
                                $detail->cr_number = $GlobalTableNo;
                                $detail->cr_date = $request->cr_date;
                                $detail->account_code = $list['account_code'];
                                $detail->particulars = $list['particulars'];
                                $detail->currency = $request->currency;
                                $detail->ex_rate = $request->ex_rate;
                                $detail->amount = $list['amount'];
                                $detail->base_amount = $list['base_amount'];
                                $detail->customer_id = $request->customer_id;
                                $detail->save();
                                $detail_id = $detail->id;
                            }
                        }
                    }
                }   
            }

            $globalController = new GlobalController();
            $globalController->logAction(
                'Credit Note (Customer)', 't_credit_note_customer_master',
                $Action,
                'CR Number : ' . $GlobalTableNo
            );

            event(new CustomerEvent($Action));

            DB::commit(); // 👍 Success
            return response()->json([
                'token'     => 'Success',
                'message'   => 'Successfully Saved',
                'id'        => $OrigID,
                'action'    => $Action
            ]);
        }
        catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'token'     => 'Error',
                'message'   => $e->getMessage(),
                'id'        => 0,
                'action'    => $Action
            ]);
        }

    }
}
