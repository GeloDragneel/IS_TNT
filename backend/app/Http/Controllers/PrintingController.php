<?php

namespace App\Http\Controllers;

use App\Libraries\OpenTBS\TBSWrapper;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use PhpOffice\PhpWord\TemplateProcessor;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

require_once app_path('Libraries/OpenTBS/tbs_class.php');
require_once app_path('Libraries/OpenTBS/tbs_plugin_opentbs.php');

use App\Models\Products;
use App\Models\Store_location;
use App\Models\ISSettings;
use App\Models\Loc_language;
use App\Models\Inventory_tblmaster;
use App\Models\Price_setup;
use App\Models\Grn_details;
use App\Models\Orders;
use App\Models\Receive_voucher_master;
use App\Models\Receive_voucher_detail;
use App\Models\Payment_orders_cn;
use App\Models\Sales_order_master;
use App\Models\Invoice_master;
use App\Models\Invoice_detail;
use App\Models\POrder_master;
use App\Models\POrder_detail;
use App\Models\Accounts_payable_master;
use App\Models\Accounts_payable_details;
use App\Models\Payment_voucher_master;
use App\Models\Inventory_allocation;
use App\Models\Shipout_items;
use App\Models\Customer;
use App\Models\Credit_note_customer;
use App\Models\Account_customer_cn;
use App\Models\Customer_group;
use App\Models\Supplier;
use App\Models\Internal_Transfer;
use App\Models\Grn_master;
use App\Models\Shipping_stat;
use App\Models\Courier;
use App\Models\Receive_voucher_master_invoices;
use App\Models\Product_images;

class PrintingController extends Controller{

    public function ISGlobal($text,$language){
        return Loc_language::where('loc_tag',$text)->value($language);
    }
    public function ConvertDateLanguage($date,$language){
        $result = '';
		if ($date != ''){
			switch($language){
				case 'en': $result = $date; break;
				case 'cn': 
					$Date = explode(" ", $date);
					$Month = $Date[0];

					switch($Month){
						case "Jan": $Month = "1月"; break;
						case "Feb": $Month = "2月"; break;
						case "Mar": $Month = "3月"; break;
						case "Apr": $Month = "4月"; break;
						case "May": $Month = "5月"; break;
						case "Jun": $Month = "6月"; break;
						case "Jul": $Month = "7月"; break;
						case "Aug": $Month = "8月"; break;
						case "Sep": $Month = "9月"; break;
						case "Oct": $Month = "10月"; break;
						case "Nov": $Month = "11月"; break;
						case "Dec": $Month = "12月"; break;
					}
					$Day = $Date[1].'日';
					$Year = $Date[2];
					$result = $Month.''.$Day.''.$Date[2];
				break;
			}
		}
        return $result;
    }
    public function exportReport(Request $request){
        $filename = $request->input('name');
        switch($filename){
            case 'ProductList':
                $this->ProductList($request);
            break;
            case 'ProductInventory':
                $this->ProductInventory($request);
            break;
            case 'DepositInvoice':
                $this->DepositInvoice($request);
            break;
            case 'OrdersList_Report':
                $this->OrdersList_Report($request);
            break;
            case 'CustomerSO':
                $this->CustomerSO($request);
            break;
            case 'DownloadSelectedSingleSO':
                $this->DownloadSelectedSingleSO($request);
            break;
            case 'CustomerInv':
                $this->CustomerInv($request);
            break;
            case 'DownloadSelectedSingleInv':
                $this->DownloadSelectedSingleInv($request);
            break;
            case 'PurchaseOrder':
                $this->PurchaseOrder($request);
            break;
            case 'DownloadSelectedSinglePO':
                $this->DownloadSelectedSinglePO($request);
            break;
            case 'PO_Report_By_Supplier':
                $this->PO_Report_By_Supplier($request);
            break;
            case 'PODepositPaid':
                $this->PODepositPaid($request);
            break;
            case 'SupplierInvoice':
                $this->SupplierInvoice($request);
            break;
            case 'DSSupplierSingleInvoices_Report':
                $this->DSSupplierSingleInvoices_Report($request);
            break;
            case 'PaidItemNotReceived':
                $this->PaidItemNotReceived($request);
            break;
            case 'UnpaidItemReceive':
                $this->UnpaidItemReceive($request);
            break;
            case 'AllocationList':
                $this->AllocationList($request);
            break;
            case 'CustomerInformation':
                $this->CustomerInformation($request);
            break;
            case 'CustomerOrders':
                $this->CustomerOrders($request);
            break;
            case 'CustomerDep':
                $this->CustomerDep($request);
            break;
            case 'CustomerProfitability':
                $this->CustomerProfitability($request);
            break;
            case 'CustomerOrderHistory':
                $this->CustomerOrderHistory($request);
            break;
            case 'CustomerGroupList':
                $this->CustomerGroupList($request);
            break;
            case 'SupplierList':
                $this->SupplierList($request);
            break;
            case 'SupplierInvoices':
                $this->SupplierInvoices($request);
            break;
            case 'SupplierPrepaid':
                $this->SupplierPrepaid($request);
            break;
            case 'SupplierProfit':
                $this->SupplierProfit($request);
            break;
            case 'SupplierRecItems':
                $this->SupplierRecItems($request);
            break;
            case 'SupplierItemOnPO':
                $this->SupplierItemOnPO($request);
            break;
            case 'CustomerCreditNote':
                $this->CustomerCreditNote($request);
            break;
            case 'CRCustomer_Report':
                $this->CRCustomer_Report($request);
            break;
            case 'InternalTransfer':
                $this->InternalTransfer($request);
            break;
            case 'ReceiveGoods':
                $this->ReceiveGoods($request);
            break;
            case 'GRN_Report':
                $this->GRN_Report($request);
            break;
            case 'GRNAllocation_Report':
                $this->GRNAllocation_Report($request);
            break;
            case 'PrepareShipment':
                $this->PrepareShipment($request);
            break;
            case 'ShipOutItems':
                $this->ShipOutItems($request);
            break;
            case 'PaymentVoucher':
                $this->PaymentVoucher($request);
            break;
            case 'DownloadSelectedSinglePV':
                $this->DownloadSelectedSinglePV($request);
            break;
            case 'ReceiveVoucher':
                $this->ReceiveVoucher($request);
            break;
            case 'RVoucher_Report':
                $this->RVoucher_Report($request);
            break;
            case 'UnsoldOrderList':
                return $this->UnsoldOrderList($request);
            break;
        }
    }
    public function ProductList($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');

        // ✅ Example data for merging
        $captionsArr = [[
            'Product' => $this->ISGlobal('Product', $language),
            'ProductCode' => $this->ISGlobal('Product Code', $language),
            'ProductName' => $this->ISGlobal('Product Name', $language),
            'RetailPrice' => $this->ISGlobal('Retail Price', $language),
            'PreorderPrice' => $this->ISGlobal('Preorder Price', $language),
            'Deposit' => $this->ISGlobal('Deposit', $language),
            'ItemCost' => $this->ISGlobal('Item Cost', $language),
        ]];

        $query = Products::with(['priceSetup', 'genres', 'images', 'priceList', 'series', 'supplier'])
            ->where('is_deleted', 0)
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
            ->orderBy('id', 'desc');

        $products = $query->get();

        // Format the result to match your template placeholders
        $data = $products->map(function ($product) use ($baseCurrency,$language) {
            $priceSetup = optional($product->priceSetup)->firstWhere('customer_group_id', 6);
            $product_title_en = $product->product_title_en ?? '';
            $product_title_cn = $product->product_title_cn ?? '';
            $product_title_cn = ($product_title_cn === '' ? $product_title_en : $product_title_cn);
            return [
                'ProductCode'           => $product->product_code ?? '',
                'ProductName'           => ($language === 'en' ? $product_title_en : $product_title_cn),
                'RetailPriceCurrency'   => optional($priceSetup)->currency,
                'PreorderPriceCurrency' => optional($priceSetup)->currency,
                'ItemDepositCurrency'   => optional($priceSetup)->currency,
                'ItemCost_Currency'     => $baseCurrency,
                'RetailPrice'           => number_format(optional($priceSetup)->retail_price,2) ?? 0,
                'PreorderPrice'         => number_format(optional($priceSetup)->preorder_price,2) ?? 0,
                'Deposit'               => number_format(optional($priceSetup)->deposit,2) ?? 0,
                'ItemCost'              => $product->item_cost ?? 0
            ];
        })->toArray();

        $resultArray = [
            'a'  => $captionsArr,
            'b'  => $data,
        ];

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);

        // ✅ Merge data into placeholders in the template

        foreach ($resultArray as $blockName => $blockData) {
            $TBS->MergeBlock($blockName, $blockData);
        }

        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;

        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function ProductInventory($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');

        // ✅ Example data for merging
        $captionsArr = [[
            'Product' => $this->ISGlobal('Product', $language),
            'Location' => $this->ISGlobal('Location', $language),
            'RemQty' => $this->ISGlobal('Rem Qty', $language),
            'CostValue' => $this->ISGlobal('Cost Value', $language),
            'RetailValue' => $this->ISGlobal('Retail Value', $language),
            'LastSoldDate' => $this->ISGlobal('Last Sold Date', $language),
            'Age' => $this->ISGlobal('Age (Days)', $language),
        ]];

        $query = Inventory_tblmaster::with(['product', 'whList'])
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
            ->orderByDesc('id');    

        $allResults = $query->get();

        // Group by product_id
        $data = $allResults->groupBy('product_id')->map(function ($items) use ($baseCurrency, $language) {
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

            $product_title_en =  $first->product->product_title_en ?? '';
            $product_title_cn =  $first->product->product_title_cn ?? '';
            $product_title_cn = ($product_title_cn === '' ? $product_title_en : $product_title_cn);

            $ageDay = $grnDetails ? \Carbon\Carbon::parse($grnDetails->grn_date)->diffInDays(now()) : 0;
            return [
                'ProductCode' => $first->product->product_code ?? '',
                'ProductName' => ($language === 'en' ? $product_title_en : $product_title_cn),
                'RetailValue' => $retailCurrency,
                'Location' => ($language === 'en' ? $warehouseLabelEn : $warehouseLabelCn),
                'LastSoldDate' => $first->product->last_sold_date ?? '',
                'RemQty' => $remainingQty,
                'CostValue' => $totalCost,
                'Age' => $ageDay,
            ];
        })->filter()->values();


        $resultArray = [
            'a'  => $captionsArr,
            'b'  => $data,
        ];

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);

        foreach ($resultArray as $blockName => $blockData) {
            $TBS->MergeBlock($blockName, $blockData);
        }
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function DepositInvoice($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }
        $preorders = Orders::with(['customer.countryList', 'customer.salesPerson','product'])->whereIn('id',$ids)->get();

        $first = $preorders->first();
 
        $billing_address_en = $first->customer->billing_address_en ?? '';
        $billing_address_cn = $first->customer->billing_address_cn ?? '';
        $billing_address_cn = ($billing_address_cn == '' ? $billing_address_en : $billing_address_cn);
        $BusinessAddress = ($language === 'en' ? $billing_address_en : $billing_address_cn);

        $country_en = $first->customer->countryList->country_en ?? '';
        $country_en = $first->customer->countryList->country_cn ?? '';
        $Country = ($language === 'en' ? $country_en : $country_en);

        $InvoiceData = array();
        $InvoiceData[] = array(
            'D_DepositNo'=>$first->order_id ?? '',
            'D_Date'=>date('M d Y'),
            'D_AccountNo'=>$first->customer->customer_code ?? '',
            'D_SalesPerson'=>$first->customer->salesPerson->full_name ?? '',
            'D_ExchangeRate'=>$first->ex_rate ?? 00,
            'D_Contact_Name'=>$first->customer->tel_no ?? '',
            'D_Company'=>$first->customer->company_en ?? '',
            'D_Business_Address'=>$BusinessAddress,
            'D_Postal_Code'=>$first->customer->postal_code ?? '',
            'D_Country'=>$Country,
            'D_Business_Phone'=>$first->customer->mobile ?? '',
            'D_Business_Fax'=>$first->customer->billing_fax_no ?? '',
            'D_BankInfo'=>'',
            'D_Remarks'=>''
        );

        $C_BankInfo = $this->ISGlobal("Bank Information",$language);
        $C_Total = $this->ISGlobal("Total",$language);
        $C_Remarks = $this->ISGlobal("Remarks",$language);
        $C_DateIssued = $this->ISGlobal("DateIssued",$language);
        $C_IssuedBy = $this->ISGlobal("IssuedBy",$language);

        $InvoiceCaption = array();
        $InvoiceCaption[] = array(
            'C_DepositNo'=>$this->ISGlobal("DepositNo",$language),
            'C_Date'=>$this->ISGlobal("Date",$language),
            'C_AccountNo'=>$this->ISGlobal("Customer Code",$language),
            'C_SalesPerson'=>$this->ISGlobal("Sales Person",$language),
            'C_ExchangeRate'=>$this->ISGlobal("Exchange Rate",$language),
            'C_BillTo'=>$this->ISGlobal("Bill To",$language),
            'C_ItemCode'=>$this->ISGlobal("Product Code",$language),
            'C_Description'=>$this->ISGlobal("Product Name",$language),
            'C_Deposit'=>$this->ISGlobal("Deposit",$language),
            'C_Qty'=>$this->ISGlobal("Qty",$language),
            'C_Price'=>$this->ISGlobal("Price",$language),
            'C_Amount'=>$this->ISGlobal("Amount",$language),
            'C_BankInfo'=>$this->ISGlobal("Bank Information",$language),
            'C_Remarks'=>$this->ISGlobal("Remarks",$language),
            'C_Total'=>$this->ISGlobal("Total",$language),
            'C_DateIssued'=>$this->ISGlobal("DateIssued",$language),
            'C_IssuedBy'=>$this->ISGlobal("IssuedBy",$language),
            'C_TelNo'=>$this->ISGlobal("Tel. No.",$language),
            'C_Fax'=>$this->ISGlobal("Fax No",$language),
        );

        $Total = 0;
        $NRows = 0;
        $data = array();
        foreach($preorders as $item){
            $NRows = $NRows + 1;
            $PcsPerCarton = $item->product->pcs_per_carton ?? 0;
            $ItemCode = $item->product->product_code ?? '';
            $product_title_en = $item->product->product_title_en ?? '';
            $product_title_cn = $item->product->product_title_cn ?? '';
            $product_title_cn = ($product_title_cn == '' ? $product_title_en : $product_title_cn);

            $id = $item->id;
            $sumRV = Receive_voucher_detail::where('order_id', $id)->sum('amount');
            $sumJV = Payment_orders_cn::where('order_id', $id)->get()
                ->groupBy('order_id')
                ->reduce(function ($carry, $group) {
                    $amount = $group->contains('is_combined', 1)
                        ? $group->where('is_combined', 1)->max('payment_order')
                        : $group->where('is_combined', 0)->sum('payment_order');

                    return $carry + $amount;
                }, 0);

            $totalDeposit = $sumRV + $sumJV;
            $FinalDeposit = ($item->order_status != 3 ? $item->item_deposit : $totalDeposit);

            $rem_qty = $item->qty - $item->allocated_qty;
            $Amount = ($rem_qty / $PcsPerCarton) * $item->item_deposit;

            $data[] = [
                'ItemCode'=>$ItemCode,
                'Description'=>($language === 'en' ? $product_title_en : $product_title_cn),
                'Deposit'=>number_format($FinalDeposit,2),
                'Currency1'=>$item->currency,
                'Qty'=>$rem_qty,
                'Currency2'=>$item->currency,
                'Price'=>number_format($item->price,2),
                'Currency3'=>$item->currency,
                'Amount'=>number_format($Amount,2),
            ];
            $Total += $FinalDeposit;
        }
        $Address = "";
		$TotalData = array();
		$TotalData[] = array(
			'Cur1'=>$first->currency ?? '',
			'Total'=>number_format($Total,2),
			'DateIssued'=> $this->ConvertDateLanguage(date('M d Y'),$language),
			'IssuedBy'=>'dannylim',
			'CompanyAddress'=>$Address
		); 

        $T_Cur1 = $first->currency ?? '';
		$T_Total = number_format($Total,2);
		$T_DateIssued = $this->ConvertDateLanguage(date('M d Y'),$language);
		$T_IssuedBy = 'dannylim';
		$T_CompanyAddress = $Address;

		$D_BankInfo = '';
		$D_Remarks = '';

		$expanderdata = array();
		$expandRow = 0;
		$newData = array();
		$Page = 1;
	
		if ($NRows >= 22 ){
			$Page = 2;
		}
		else if ($NRows >= 57 ){
			$Page = 3;
		}
		else{
			$Page = 4;
		}
	
		if ($NRows >= 22 ){
			$Page = 2;
		}
		if ($NRows <= 22 ){
			$expandRow = 21 - $NRows;
			$newData = $data;
		}
		else{
			$ExcessCount = $NRows - 22;
			$expandRow = 35 - $ExcessCount;
			$countElse = 0;
			for ($x=0; $x<$NRows; $x++){
				if($x < 22){
					$newData[] = array(
						'ItemCode'=>$data[$x]['ItemCode'],
						'Description'=>$data[$x]['Description'],
						'Deposit'=>$data[$x]['Deposit'],
						'Currency1'=>$data[$x]['Currency1'],
						'Qty'=>$data[$x]['Qty'],
						'Currency2'=>$data[$x]['Currency2'],
						'Price'=>$data[$x]['Price'],
						'Currency3'=>$data[$x]['Currency3'],
						'Amount'=>$data[$x]->base_amount,
					);
				}
				else{
					if($countElse == 0){
						$PageEN = "Continue page " . $Page;
						$PageCN = "续第 ($Page) 页";
						$PageMessage = ($language == 'en' ? $PageEN : $PageCN);
						$newData[] = array(
							'ItemCode'=>"",
							'Description'=>"",
							'Deposit'=>"",
							'Qty'=>"",
							'Price'=>"",
							'Currency1'=>"",
							'Total'=>"",
						);
						$newData[] = array(
							'ItemCode'=>"",
							'Description'=>$PageMessage,
							'Deposit'=>"",
							'Qty'=>"",
							'Price'=>"",
							'Currency1'=>"",
							'Total'=>"",
						);
						$newData[] = array(
							'ItemCode'=>"",
							'Description'=>"",
							'Deposit'=>"",
							'Currency1'=>"",
							'Qty'=>"",
							'Currency2'=>"",
							'Price'=>"",
							'Currency3'=>"",
							'Amount'=>"",
						);
						$newData[] = array(
							'ItemCode'=>"",
							'Description'=>"",
							'Deposit'=>"",
							'Currency1'=>"",
							'Qty'=>"",
							'Currency2'=>"",
							'Price'=>"",
							'Currency3'=>"",
							'Amount'=>"",
						);
						$newData[] = array(
							'ItemCode'=>"",
							'Description'=>"",
							'Deposit'=>"",
							'Currency1'=>"",
							'Qty'=>"",
							'Currency2'=>"",
							'Price'=>"",
							'Currency3'=>"",
							'Amount'=>"",
						);
						$newData[] = array(
							'ItemCode'=>"",
							'Description'=>"",
							'Deposit'=>"",
							'Currency1'=>"",
							'Qty'=>"",
							'Currency2'=>"",
							'Price'=>"",
							'Currency3'=>"",
							'Amount'=>"",
						);
					}
					$countElse++;
				}
			}
			for ($x=0; $x<$NRows; $x++){
				if($x > 21){
					$newData[] = array(
						'ItemCode'=>$data[$x]['ItemCode'],
						'Description'=>$data[$x]['Description'],
						'Deposit'=>$data[$x]['Deposit'],
						'Currency1'=>$data[$x]['Currency1'],
						'Qty'=>$data[$x]['Qty'],
						'Currency2'=>$data[$x]['Currency2'],
						'Price'=>$data[$x]['Price'],
						'Currency3'=>$data[$x]['Currency3'],
						'Amount'=>$data[$x]->base_amount,
					);
				}
			}
		}
		$expandRow = $expandRow - 1;
		for ($j=0; $j<$expandRow; $j++){
			$expanderdata[] = array('expander'=>"");
        }

        $TBS->VarRef['C_BankInfo']    = $C_BankInfo;
        $TBS->VarRef['D_BankInfo']    = $D_BankInfo;
        $TBS->VarRef['C_Total']       = $C_Total;
        $TBS->VarRef['T_Cur1']        = $T_Cur1;
        $TBS->VarRef['T_Total']       = $T_Total;
        $TBS->VarRef['C_DateIssued']  = $C_DateIssued;
        $TBS->VarRef['T_DateIssued']  = $T_DateIssued;
        $TBS->VarRef['C_Remarks']     = $C_Remarks;
        $TBS->VarRef['D_Remarks']     = $D_Remarks;
        $TBS->VarRef['C_IssuedBy']    = $C_IssuedBy;
        $TBS->VarRef['T_IssuedBy']    = $T_IssuedBy;

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('IC', $InvoiceCaption);
        $TBS->MergeBlock('ID', $InvoiceData);
        $TBS->MergeBlock('b', $data);
        $TBS->MergeBlock('T', $TotalData);
        $TBS->MergeBlock('d', $expanderdata);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function OrdersList_Report($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $preorders = Orders::with(['customer.countryList', 'customer.salesPerson', 'customer.source','product'])
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))->get();

        $caption = array();
        $caption[] = array(
            'caption1'=>$this->ISGlobal("Order Date",$language),
            'caption2'=>$this->ISGlobal("Customer",$language),
            'caption3'=>$this->ISGlobal("Sales Person",$language),
            'caption4'=>$this->ISGlobal("Product Name",$language),
            'caption5'=>$this->ISGlobal("Price",$language),
            'caption6'=>$this->ISGlobal("Qty",$language),
            'caption7'=>$this->ISGlobal("Total",$language),
            'caption8'=>$this->ISGlobal("Default Currency",$language),
            'caption9'=>$this->ISGlobal("Total Cost",$language),
            'caption10'=>$this->ISGlobal("Total Profit",$language),
            'caption11'=>$this->ISGlobal("Deposit",$language),
        );

        $Total = 0;
        $data = array();
        foreach($preorders as $item){
            $ItemCode = $item->product->product_code ?? '';
            $product_title_en = $item->product->product_title_en ?? '';
            $product_title_cn = $item->product->product_title_cn ?? '';
            $product_title_cn = ($product_title_cn == '' ? $product_title_en : $product_title_cn);

            $FinalDeposit = 0;
            $Amount = 0;

            $rem_qty = $item->qty - $item->allocated_qty;

            $id = $item->id;
            $sumRV = Receive_voucher_detail::where('order_id', $id)->sum('amount');
            $sumJV = Payment_orders_cn::where('order_id', $id)->get()
                ->groupBy('order_id')
                ->reduce(function ($carry, $group) {
                    $amount = $group->contains('is_combined', 1)
                        ? $group->where('is_combined', 1)->max('payment_order')
                        : $group->where('is_combined', 0)->sum('payment_order');

                    return $carry + $amount;
                }, 0);

            $totalDeposit = $sumRV + $sumJV;
            $FinalDeposit = ($item->order_status === 2 ? 0.00 : $totalDeposit);

            $source_en = $item->customer?->source->description_en ?? '';
            $source_cn = $item->customer?->source->description_cn ?? '';
            $Source = ($language === 'en' ? $source_en : $source_cn);

            $data[] = [
                'OrderDate' => $this->ConvertDateLanguage(date('M d Y'),$language),
                'Customer' => $item->customer->customer_code ?? '',
                'SalesPerson'=>$item->customer->salesPerson->full_name ?? '',
                'Account_Name' => $item->customer->account_name_en ?? '',
                'Source'=> $Source,
                'UserID'=> $item->customer->user_id ?? '',
                'ItemCode'=> $ItemCode,
                'Description'=> ($language === 'en' ? $product_title_en : $product_title_cn),
                'Price'=> number_format($item->price,2),
                'Qty'=> $item->qty,
                'Currency'=> $item->currency,
                'BaseCurrency'=> number_format($item->base_total,2),
                'Total'=> number_format($item->qty * $item->price,2),
                'BaseTotal'=> number_format($item->base_total,2),
                'ECostTotal'=> number_format($item->e_cost_total,2),
                'EProfit'=> number_format($item->e_profit,2),
                'Deposit'=> number_format($FinalDeposit,2),
                'Deposit2'=> number_format($item->item_deposit,2),
            ];
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $caption);
        $TBS->MergeBlock('b', $data);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function CustomerSO($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $salesOrder = Sales_order_master::with([
            'customer:id,account_name_en,account_name_cn,customer_code',
            'invoiceStatus:id,status_value_en,status_value_cn',
        ])->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
        ->orderByDesc('id')->get();

        $caption = array();
        $caption[] = array(
            'SONumber'=>$this->ISGlobal("SO Number",$language),
            'Customer'=>$this->ISGlobal("Customer",$language),
            'CustomerCode'=>$this->ISGlobal("Customer Code",$language),
            'CustomerName'=>$this->ISGlobal("Customer Name",$language),
            'Total'=>$this->ISGlobal("Total",$language),
            'Deposit'=>$this->ISGlobal("Deposit",$language),
            'CreditUsed'=>$this->ISGlobal("Credit Used",$language),
            'Balance'=>$this->ISGlobal("Balance",$language),
            'InvoiceNo'=>$this->ISGlobal("Invoice No",$language),
            'Status'=>$this->ISGlobal("Invoice Status",$language),
        );

        $Total = 0;
        $data = array();
        foreach($salesOrder as $item){
           
            $status_value_en = $item->invoiceStatus?->status_value_en ?? '';
            $status_value_cn = $item->invoiceStatus?->status_value_cn ?? '';
            $InvoiceStatus = ($language === 'en' ? $status_value_en : $status_value_cn);

            $data[] = [
                'SONumber' => $item->so_number ?? '',
                'CustomerCode' => $item->customer->customer_code ?? '',
                'CustomerName' => $item->customer->account_name_en ?? '',
                'InvoiceNo' => $item->invoice_no ?? '',
                'Currency' => $item->currency ?? '',
                'Total'=> number_format($item->total,2),
                'CreditUsed'=> number_format($item->credit_used,2),
                'Deposit'=> number_format($item->total_deposit,2),
                'Balance'=> number_format($item->total_to_pay,2),
                'Status'=> $InvoiceStatus
            ];
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $caption);
        $TBS->MergeBlock('b', $data);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function DownloadSelectedSingleSO($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        $TBS->VarRef['T_SalesOrder'] = ($language == 'en' ? 'SALES ORDER' : '销售单');
        $TBS->VarRef['TelNo'] = "+65910081684";

        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }
        
        $salesOrder = Sales_order_master::with([
            'customer',
            'invoiceStatus:id,status_value_en,status_value_cn',
            'salesOrderDetails.productItem:id,product_code,product_title_en,product_title_cn',
            'salesOrderDetailsCopy.productItem:id,product_code,product_title_en,product_title_cn',
        ])->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
        ->orderByDesc('id')->get();

        $first = $salesOrder->first();

        $PrintType = $first->customer->customer_type;
        if($PrintType === 'RC'){
            $templatePath = base_path('templates/ReportTemplate/ARInvoice_Report_RC.odt');
        }
        else{
            $templatePath = base_path('templates/ReportTemplate/ARInvoice_Report.odt');
        }

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        // ✅ Determine if we need to create a zip (multiple records) or single download
        $isSingleDownload = count($salesOrder) === 1;
        
        // ✅ Only create zip if multiple records
        if (!$isSingleDownload) {
            $zip = new \clsTbsZip();
            $zip->CreateNew();
        }

        $F_CustomerCode = "";
        $ReferenceNo = array();

        foreach($salesOrder as $item){

            $soNumber = $item->so_number;
            array_push($ReferenceNo,$soNumber);
        
            $status_value_en = $item->invoiceStatus?->status_value_en ?? '';
            $status_value_cn = $item->invoiceStatus?->status_value_cn ?? '';
            $InvoiceStatus = ($language === 'en' ? $status_value_en : $status_value_cn);

            $GlobSONumber = $item->so_number;
            $BankInfo = $item->customer->account_name_en;
            $InvoiceCurrency = $item->currency;
            $F_CustomerCode = $item->customer->customer_code;

            $DeliveryMethod = "";

            $payment_terms_en = $item->paymentTerms?->payment_terms_en ?? '';
            $payment_terms_cn = $item->paymentTerms?->payment_terms_cn ?? '';
            $payment_terms_cn = ($payment_terms_cn === '' ? $payment_terms_en : $payment_terms_cn);
            $PaymentTerms = ($language === 'en' ? $payment_terms_en : $payment_terms_cn);

            $shipping_terms_en = $item->customer->shippingTerms?->shipping_terms_en ?? '';
            $shipping_terms_cn = $item->customer->shippingTerms?->shipping_terms_cn ?? '';
            $shipping_terms_cn = ($shipping_terms_cn === '' ? $shipping_terms_en : $shipping_terms_cn);
            $ShippingTerms = ($language === 'en' ? $shipping_terms_en : $shipping_terms_cn);

            $billing_address_en = $item->customer->billing_address_en ?? '';
            $billing_address_cn = $item->customer->billing_address_cn ?? '';
            $billing_address_cn = ($billing_address_cn === '' ? $billing_address_en : $billing_address_cn);
            $M_Business_Address = ($language === 'en' ? $billing_address_en : $billing_address_cn);

            $delivery_address_en = $item->customer->delivery_address_en ?? '';
            $delivery_address_cn = $item->customer->delivery_address_cn ?? '';
            $delivery_address_cn = ($delivery_address_cn === '' ? $delivery_address_en : $delivery_address_cn);
            $M_Delivery_Address = ($language === 'en' ? $delivery_address_en : $delivery_address_cn);

            $billing_country_en = $item->customer->countryList?->country_en ?? '';
            $billing_country_cn = $item->customer->countryList?->country_cn ?? '';
            $M_Country = ($language === 'en' ? $billing_country_en : $billing_country_cn);

            $delivery_country_en = $item->customer->countryList2?->country_en ?? '';
            $delivery_country_cn = $item->customer->countryList2?->country_cn ?? '';
            $M_Country2 = ($language === 'en' ? $delivery_country_en : $delivery_country_cn);

            $Business_Phone = ($PrintType === "WC" ? $item->customer->mobile : $item->customer->tel_no);

            $source_en = $item->customer?->source->description_en ?? '';
            $source_cn = $item->customer?->source->description_cn ?? '';
            $Source = ($language === 'en' ? $source_en : $source_cn);

            $masterdata = array();
            $masterdata[] = array(
                'M_ARInvoiceNo'=> $item->so_number,
                'M_ARDate'=> $this->ConvertDateLanguage($item->so_date,$language),
                'M_Customer_No'=> $item->customer->customer_code,
                'M_SalesPerson'=> $item->customer->salesPerson->full_name ?? '',
                'M_ExRate'=> $item->ex_rate,
                'M_DeliveryMethod'=> $DeliveryMethod,
                'M_ShippingTerms'=> $ShippingTerms,
                'M_DeliveryDate'=> $this->ConvertDateLanguage($item->delivery_date,$language),
                'M_PaymentTerms'=> $PaymentTerms,
                'M_DueDate'=> $this->ConvertDateLanguage($item->due_date,$language),
                'M_Contact_Name'=> $item->customer->account_name_en,
                'M_Contact_Name2'=> $item->customer->account_name_en,
                'M_Company'=> $item->customer->company_en,
                'M_Company2'=> $item->customer->company_en,
                'M_Business_Address'=> $M_Business_Address,
                'M_Delivery_Address'=>$M_Delivery_Address,
                'M_Postal_Code'=> $item->customer->billing_postal_code,
                'M_Postal_Code2'=> $item->customer->delivery_postal_code,
                'M_Country'=> $M_Country,
                'M_Country2'=> $M_Country2,
                'M_Business_Phone'=>$Business_Phone,
                'M_Shipping_Phone'=> $item->customer->delivery_tel_no,
                'M_Business_Fax'=> $item->customer->billing_fax_no,
                'M_Shipping_Fax'=> $item->customer->delivery_fax_no,
                'M_UserID'=>$item->customer->user_id,
                'M_Source'=> $Source,
                'C_DeliveryMethod'=>$this->ISGlobal('Delivery Method',$language),
                'C_ShippingTerms'=>$this->ISGlobal('Shipping Terms',$language),
                'C_DeliveryDate'=>$this->ISGlobal('Delivery Date',$language),
                'C_PaymentTerms'=>$this->ISGlobal('Payment Terms',$language),
                'C_DueDate'=>$this->ISGlobal('Due Date',$language),
                'C_BillTo'=>($language == 'en' ? 'Bill To' : '地址'),
                'C_ShipTo'=>($language == 'en' ? 'Ship To' : '发货地址'),
                'C_Fax'=>$this->ISGlobal('Fax No',$language),
                'C_Fax2'=>$this->ISGlobal('Fax No',$language),
                'C_TelNo'=>$this->ISGlobal('Tel No',$language),
                'C_TelNo2'=>$this->ISGlobal('Tel No',$language),
                'C_ARInvoiceNo'=>($language == 'en' ? 'SO Number' : '销售单号'),
                'C_Date'=>$this->ISGlobal('Date',$language),
                'C_AccountNo'=>($language == 'en' ? 'Account No' : '客户账号'),
                'C_SalesPerson'=>($language == 'en' ? 'Sales Person' : '销售元'),
                'C_ExchangeRate'=>$this->ISGlobal('Ex Rate',$language)
            );

            $TBS->VarRef['Currency'] = $item->currency;
            $TBS->VarRef['M_TotalDep'] = number_format($item->total_deposit,2);
            $TBS->VarRef['M_CreditUsed'] = number_format($item->credit_used,2);
            $TBS->VarRef['M_Voucher'] = number_format($item->voucher_amount,2);
            $TBS->VarRef['M_SubTotal'] = number_format($item->sub_total,2);
            $TBS->VarRef['M_GST'] = number_format($item->tax_amount,2);
            $TBS->VarRef['M_Total'] = number_format($item->total,2);
            $TBS->VarRef['M_TotalPay'] = number_format($item->total_to_pay - $item->voucher_amount,2);
            $TBS->VarRef['M_Remarks'] = '';
            
            $TotalToPay = $item->total - $item->total_deduction - $item->voucher_amount;
            
            $bottomdata = array();
            $bottomdata[] = array(
                'M_BankInfo'=>"",
                'C_BankInfo'=>"",
                'M_Remarks'=>"",
                'C_Remarks'=>$this->ISGlobal('Remarks',$language),
                'M_Cur1'=>$item->currency,
                'M_Cur2'=>$item->currency,
                'M_Cur3'=>$item->currency,
                'M_Cur4'=>$item->currency,
                'M_Cur5'=>$item->currency,
                'M_Cur6'=>$item->currency,
                'M_SubTotal'=>number_format($item->sub_total,2),
                'M_GST'=>number_format($item->tax_amount,2),
                'M_Total'=>number_format($item->total,2),
                'M_TotalDep'=>number_format($item->total_deposit,2),
                'M_TotalPay'=>number_format($TotalToPay,2),
                'M_CreditUsed'=>number_format($item->credit_used,2),
                'C_SubTotal'=>$this->ISGlobal('Sub Total',$language),
                'C_GST'=>$this->ISGlobal('GST',$language),
                'C_Total'=>$this->ISGlobal('Total',$language),
                'C_TotalDeposit'=>$this->ISGlobal('Deposit',$language),
                'C_CreditUsed'=>$this->ISGlobal('Credit Used',$language),
                'C_TotalToPay'=>$this->ISGlobal('Total To Pay',$language),
                'C_IssuedBy'=>$this->ISGlobal('IssuedBy',$language)." : "."",
                'C_DateIssued'=>$this->ISGlobal('DateIssued',$language)." : ".$this->ConvertDateLanguage($item->so_date,$language)
            );

            $TBS->VarRef['C_TotalDeposit'] = $this->ISGlobal('Deposit',$language);
            $TBS->VarRef['C_SubTotal'] = $this->ISGlobal('Sub Total',$language);
            $TBS->VarRef['C_GST'] = $this->ISGlobal('GST',$language);
            $TBS->VarRef['C_Total'] = $this->ISGlobal('Total',$language);
            $TBS->VarRef['C_CreditUsed'] = $this->ISGlobal('Credit Used',$language);
            $TBS->VarRef['C_TotalToPay'] = $this->ISGlobal('Total To Pay',$language);
            $TBS->VarRef['C_Remarks'] = $this->ISGlobal('Remarks',$language);
            $TBS->VarRef['C_Voucher'] = $this->ISGlobal('Voucher',$language);

            $caption = array();
            $caption[] = array(
                'caption1'=>$this->ISGlobal("Product Code",$language),
                'caption2'=>$this->ISGlobal("Description",$language),
                'caption3'=>$this->ISGlobal("Deposit",$language),
                'caption4'=>$this->ISGlobal("Qty",$language),
                'caption5'=>$this->ISGlobal("Price",$language),
                'caption6'=>$first->currency ?? "",
                'caption7'=>$this->ISGlobal("Total",$language),
            );

            $data = array();
            $NRows = 0;

            foreach ($item->salesOrderDetails as $detail) {
                $NRows = $NRows + 1;
                $product_title_en = $detail->productItem?->product_title_en ?? '';
                $product_title_cn = $detail->productItem?->product_title_cn ?? '';
                $product_title_cn = ($product_title_cn === '' ? $product_title_en : $product_title_cn);
                $Description = ($language === 'en' ? $product_title_en : $product_title_cn);

                $data[] = array(
                    'ItemCode'=>$detail->productItem->product_code,
                    'Description'=>$Description,
                    'Deposit'=>number_format($detail->deposit,2),
                    'Qty'=>$detail->qty,
                    'Price'=>number_format($detail->price,2),
                    'Currency1'=>$detail->currency,
                    'Total'=>number_format($detail->total,2)
                );
            }

            $expanderdata = [];
            $expandRow = 0;

            // Handle $NRows from 1 to 21
            if ($NRows >= 1 && $NRows <= 21) {
                $expandRow = 22 - $NRows;
            }

            // Handle $NRows from 22 to 27 (custom exceptions)
            $exceptions = [
                22 => 42,
                23 => 41,
                24 => 40,
                25 => 39,
                26 => 38,
                27 => 37,
                28 => 35, // INCLUDE HEADER IN 2ND PAGE
            ];

            // If $NRows is an exception, use it
            if (isset($exceptions[$NRows])) {
                $expandRow = $exceptions[$NRows];
            }

            // Handle $NRows from 29 to 62 (follows formula)
            if ($NRows >= 29 && $NRows <= 62) {
                $expandRow = 63 - $NRows;
            }

            // Adjustments for language
            if ($language === 'cn') {
                $expandRow -= ($NRows <= 21) ? 1 : 2;
            }

            // Adjustments for specific customer
            if ($F_CustomerCode === 'WH-ID-GZTS') {
                $expandRow -= ($language === 'en') ? 3 : 4;
            }
            
            // Fill the array
            for ($j = 0; $j < $expandRow; $j++) {
                $expanderdata[] = ['expander' => ""];
            }

            $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
            $TBS->MergeBlock('m', $masterdata);
            $TBS->MergeBlock('a', $caption);
            $TBS->MergeBlock('b', $data);
            $TBS->MergeBlock('c', $bottomdata);
            $TBS->MergeBlock('d', $expanderdata);
            
            // ✅ Output file name
            $outputFileName = $soNumber . '.' . $format;
            
            // ✅ Single download: immediately download and exit
            if ($isSingleDownload) {
                $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
                exit;
            }
            
            // ✅ Multiple downloads: save to string and add to zip
            $TBS->Show(OPENTBS_STRING);
            $zip->FileAdd($outputFileName, $TBS->Source, TBSZIP_STRING);
        }
        
        // ✅ For multiple files, flush the zip
        if (!$isSingleDownload) {
            $zip->Flush(TBSZIP_DOWNLOAD, 'SelectedCustomerSalesOrder.zip');
        }
    }
    public function CustomerInv($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $masters = Invoice_master::with([
            'customer:id,account_name_en,account_name_cn,customer_code',
            'invoiceStatus:id,status_value_en,status_value_cn',
        ])->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
        ->orderByDesc('id')->get();

        $caption = array();
        $caption[] = array(
            'ARInvoiceNo'=>$this->ISGlobal("Invoice No",$language),
            'Customer'=>$this->ISGlobal("Customer",$language),
            'Customer_No'=>$this->ISGlobal("Customer Code",$language),
            'Customer_Name'=>$this->ISGlobal("Customer Name",$language),
            'Total'=>$this->ISGlobal("Total",$language),
            'TotalDeposit'=>$this->ISGlobal("Deposit",$language),
            'CreditUsed'=>$this->ISGlobal("Credit Used",$language),
            'Balance'=>$this->ISGlobal("Balance",$language),
            'InvoiceNo'=>$this->ISGlobal("Invoice No",$language),
            'InvoiceStatus'=>$this->ISGlobal("Invoice Status",$language),
        );

        $Total = 0;
        $data = array();
        foreach($masters as $item){
           
            $status_value_en = $item->invoiceStatus?->status_value_en ?? '';
            $status_value_cn = $item->invoiceStatus?->status_value_cn ?? '';
            $InvoiceStatus = ($language === 'en' ? $status_value_en : $status_value_cn);

            $data[] = [
                'ARInvoiceNo' => $item->invoice_no ?? '',
                'Customer_No' => $item->customer->customer_code ?? '',
                'Customer_Name' => $item->customer->account_name_en ?? '',
                'InvoiceNo' => $item->invoice_no ?? '',
                'Currency' => $item->currency ?? '',
                'Total'=> number_format($item->total,2),
                'CreditUsed'=> number_format($item->credit_used,2),
                'TotalDeposit'=> number_format($item->total_deposit,2),
                'Balance'=> number_format($item->total_to_pay,2),
                'InvoiceStatus'=> $InvoiceStatus
            ];
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $caption);
        $TBS->MergeBlock('b', $data);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function DownloadSelectedSingleInv($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        $TBS->VarRef['T_SalesOrder'] = ($language == 'en' ? 'TAX INVOICE' : '账单');
        $TBS->VarRef['TelNo'] = "+65910081684";

        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }
        
        $salesOrder = Invoice_master::with([
            'customer',
            'invoiceStatus:id,status_value_en,status_value_cn',
            'invoiceDetails.product:id,product_code,product_title_en,product_title_cn',
            'invoiceDetailsCopy.product:id,product_code,product_title_en,product_title_cn',
        ])->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
        ->orderByDesc('id')->get();

        $first = $salesOrder->first();

        $PrintType = $first->customer->customer_type;
        if($PrintType === 'RC'){
            $templatePath = base_path('templates/ReportTemplate/ARInvoice_Report_RC.odt');
        }
        else{
            $templatePath = base_path('templates/ReportTemplate/ARInvoice_Report.odt');
        }

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        // ✅ Determine if we need to create a zip (multiple records) or single download
        $isSingleDownload = count($salesOrder) === 1;
        
        // ✅ Only create zip if multiple records
        if (!$isSingleDownload) {
            $zip = new \clsTbsZip();
            $zip->CreateNew();
        }

        $F_CustomerCode = "";
        $ReferenceNo = array();

        foreach($salesOrder as $item){

            $soNumber = $item->invoice_no;
            array_push($ReferenceNo,$soNumber);
        
            $status_value_en = $item->invoiceStatus?->status_value_en ?? '';
            $status_value_cn = $item->invoiceStatus?->status_value_cn ?? '';
            $InvoiceStatus = ($language === 'en' ? $status_value_en : $status_value_cn);

            $GlobSONumber = $item->invoice_no;
            $BankInfo = $item->customer->account_name_en;
            $InvoiceCurrency = $item->currency;
            $F_CustomerCode = $item->customer->customer_code;

            $DeliveryMethod = "";

            $payment_terms_en = $item->paymentTerms?->payment_terms_en ?? '';
            $payment_terms_cn = $item->paymentTerms?->payment_terms_cn ?? '';
            $payment_terms_cn = ($payment_terms_cn === '' ? $payment_terms_en : $payment_terms_cn);
            $PaymentTerms = ($language === 'en' ? $payment_terms_en : $payment_terms_cn);

            $shipping_terms_en = $item->customer->shippingTerms?->shipping_terms_en ?? '';
            $shipping_terms_cn = $item->customer->shippingTerms?->shipping_terms_cn ?? '';
            $shipping_terms_cn = ($shipping_terms_cn === '' ? $shipping_terms_en : $shipping_terms_cn);
            $ShippingTerms = ($language === 'en' ? $shipping_terms_en : $shipping_terms_cn);

            $billing_address_en = $item->customer->billing_address_en ?? '';
            $billing_address_cn = $item->customer->billing_address_cn ?? '';
            $billing_address_cn = ($billing_address_cn === '' ? $billing_address_en : $billing_address_cn);
            $M_Business_Address = ($language === 'en' ? $billing_address_en : $billing_address_cn);

            $delivery_address_en = $item->customer->delivery_address_en ?? '';
            $delivery_address_cn = $item->customer->delivery_address_cn ?? '';
            $delivery_address_cn = ($delivery_address_cn === '' ? $delivery_address_en : $delivery_address_cn);
            $M_Delivery_Address = ($language === 'en' ? $delivery_address_en : $delivery_address_cn);

            $billing_country_en = $item->customer->countryList?->country_en ?? '';
            $billing_country_cn = $item->customer->countryList?->country_cn ?? '';
            $M_Country = ($language === 'en' ? $billing_country_en : $billing_country_cn);

            $delivery_country_en = $item->customer->countryList2?->country_en ?? '';
            $delivery_country_cn = $item->customer->countryList2?->country_cn ?? '';
            $M_Country2 = ($language === 'en' ? $delivery_country_en : $delivery_country_cn);

            $Business_Phone = ($PrintType === "WC" ? $item->customer->mobile : $item->customer->tel_no);

            $source_en = $item->customer?->source->description_en ?? '';
            $source_cn = $item->customer?->source->description_cn ?? '';
            $Source = ($language === 'en' ? $source_en : $source_cn);

            $masterdata = array();
            $masterdata[] = array(
                'M_ARInvoiceNo'=> $item->invoice_no,
                'M_ARDate'=> $this->ConvertDateLanguage($item->invoice_date,$language),
                'M_Customer_No'=> $item->customer->customer_code,
                'M_SalesPerson'=> $item->customer->salesPerson->full_name ?? '',
                'M_ExRate'=> $item->ex_rate,
                'M_DeliveryMethod'=> $DeliveryMethod,
                'M_ShippingTerms'=> $ShippingTerms,
                'M_DeliveryDate'=> $this->ConvertDateLanguage($item->delivery_date,$language),
                'M_PaymentTerms'=> $PaymentTerms,
                'M_DueDate'=> $this->ConvertDateLanguage($item->due_date,$language),
                'M_Contact_Name'=> $item->customer->account_name_en,
                'M_Contact_Name2'=> $item->customer->account_name_en,
                'M_Company'=> $item->customer->company_en,
                'M_Company2'=> $item->customer->company_en,
                'M_Business_Address'=> $M_Business_Address,
                'M_Delivery_Address'=>$M_Delivery_Address,
                'M_Postal_Code'=> $item->customer->billing_postal_code,
                'M_Postal_Code2'=> $item->customer->delivery_postal_code,
                'M_Country'=> $M_Country,
                'M_Country2'=> $M_Country2,
                'M_Business_Phone'=>$Business_Phone,
                'M_Shipping_Phone'=> $item->customer->delivery_tel_no,
                'M_Business_Fax'=> $item->customer->billing_fax_no,
                'M_Shipping_Fax'=> $item->customer->delivery_fax_no,
                'M_UserID'=>$item->customer->user_id,
                'M_Source'=> $Source,
                'C_DeliveryMethod'=>$this->ISGlobal('Delivery Method',$language),
                'C_ShippingTerms'=>$this->ISGlobal('Shipping Terms',$language),
                'C_DeliveryDate'=>$this->ISGlobal('Delivery Date',$language),
                'C_PaymentTerms'=>$this->ISGlobal('Payment Terms',$language),
                'C_DueDate'=>$this->ISGlobal('Due Date',$language),
                'C_BillTo'=>($language == 'en' ? 'Bill To' : '地址'),
                'C_ShipTo'=>($language == 'en' ? 'Ship To' : '发货地址'),
                'C_Fax'=>$this->ISGlobal('Fax No',$language),
                'C_Fax2'=>$this->ISGlobal('Fax No',$language),
                'C_TelNo'=>$this->ISGlobal('Tel No',$language),
                'C_TelNo2'=>$this->ISGlobal('Tel No',$language),
                'C_ARInvoiceNo'=>($language == 'en' ? 'SO Number' : '销售单号'),
                'C_Date'=>$this->ISGlobal('Date',$language),
                'C_AccountNo'=>($language == 'en' ? 'Account No' : '客户账号'),
                'C_SalesPerson'=>($language == 'en' ? 'Sales Person' : '销售元'),
                'C_ExchangeRate'=>$this->ISGlobal('Ex Rate',$language)
            );

            $TBS->VarRef['Currency'] = $item->currency;
            $TBS->VarRef['M_TotalDep'] = number_format($item->total_deposit,2);
            $TBS->VarRef['M_CreditUsed'] = number_format($item->credit_used,2);
            $TBS->VarRef['M_Voucher'] = number_format($item->voucher_amount,2);
            $TBS->VarRef['M_SubTotal'] = number_format($item->sub_total,2);
            $TBS->VarRef['M_GST'] = number_format($item->tax_amount,2);
            $TBS->VarRef['M_Total'] = number_format($item->total,2);
            $TBS->VarRef['M_TotalPay'] = number_format($item->total_to_pay - $item->voucher_amount,2);
            $TBS->VarRef['M_Remarks'] = '';
            
            $TotalToPay = $item->total - $item->total_deduction - $item->voucher_amount;
            
            $bottomdata = array();
            $bottomdata[] = array(
                'M_BankInfo'=>"",
                'C_BankInfo'=>"",
                'M_Remarks'=>"",
                'C_Remarks'=>$this->ISGlobal('Remarks',$language),
                'M_Cur1'=>$item->currency,
                'M_Cur2'=>$item->currency,
                'M_Cur3'=>$item->currency,
                'M_Cur4'=>$item->currency,
                'M_Cur5'=>$item->currency,
                'M_Cur6'=>$item->currency,
                'M_SubTotal'=>number_format($item->sub_total,2),
                'M_GST'=>number_format($item->tax_amount,2),
                'M_Total'=>number_format($item->total,2),
                'M_TotalDep'=>number_format($item->total_deposit,2),
                'M_TotalPay'=>number_format($TotalToPay,2),
                'M_CreditUsed'=>number_format($item->credit_used,2),
                'C_SubTotal'=>$this->ISGlobal('Sub Total',$language),
                'C_GST'=>$this->ISGlobal('GST',$language),
                'C_Total'=>$this->ISGlobal('Total',$language),
                'C_TotalDeposit'=>$this->ISGlobal('Deposit',$language),
                'C_CreditUsed'=>$this->ISGlobal('Credit Used',$language),
                'C_TotalToPay'=>$this->ISGlobal('Total To Pay',$language),
                'C_IssuedBy'=>$this->ISGlobal('IssuedBy',$language)." : "."",
                'C_DateIssued'=>$this->ISGlobal('DateIssued',$language)." : ".$this->ConvertDateLanguage($item->invoice_date,$language)
            );

            $TBS->VarRef['C_TotalDeposit'] = $this->ISGlobal('Deposit',$language);
            $TBS->VarRef['C_SubTotal'] = $this->ISGlobal('Sub Total',$language);
            $TBS->VarRef['C_GST'] = $this->ISGlobal('GST',$language);
            $TBS->VarRef['C_Total'] = $this->ISGlobal('Total',$language);
            $TBS->VarRef['C_CreditUsed'] = $this->ISGlobal('Credit Used',$language);
            $TBS->VarRef['C_TotalToPay'] = $this->ISGlobal('Total To Pay',$language);
            $TBS->VarRef['C_Remarks'] = $this->ISGlobal('Remarks',$language);
            $TBS->VarRef['C_Voucher'] = $this->ISGlobal('Voucher',$language);

            $caption = array();
            $caption[] = array(
                'caption1'=>$this->ISGlobal("Product Code",$language),
                'caption2'=>$this->ISGlobal("Description",$language),
                'caption3'=>$this->ISGlobal("Deposit",$language),
                'caption4'=>$this->ISGlobal("Qty",$language),
                'caption5'=>$this->ISGlobal("Price",$language),
                'caption6'=>$first->currency ?? "",
                'caption7'=>$this->ISGlobal("Total",$language),
            );

            $data = array();
            $NRows = 0;

            foreach ($item->invoiceDetails as $detail) {
                $NRows = $NRows + 1;
                $product_title_en = $detail->product?->product_title_en ?? '';
                $product_title_cn = $detail->product?->product_title_cn ?? '';
                $product_title_cn = ($product_title_cn === '' ? $product_title_en : $product_title_cn);
                $Description = ($language === 'en' ? $product_title_en : $product_title_cn);

                $data[] = array(
                    'ItemCode'=>$detail->product->product_code,
                    'Description'=>$Description,
                    'Deposit'=>number_format($detail->deposit,2),
                    'Qty'=>$detail->qty,
                    'Price'=>number_format($detail->price,2),
                    'Currency1'=>$detail->currency,
                    'Total'=>number_format($detail->total,2)
                );
            }

            $expanderdata = [];
            $expandRow = 0;

            // Handle $NRows from 1 to 21
            if ($NRows >= 1 && $NRows <= 21) {
                $expandRow = 22 - $NRows;
            }

            // Handle $NRows from 22 to 27 (custom exceptions)
            $exceptions = [
                22 => 42,
                23 => 41,
                24 => 40,
                25 => 39,
                26 => 38,
                27 => 37,
                28 => 35, // INCLUDE HEADER IN 2ND PAGE
            ];

            // If $NRows is an exception, use it
            if (isset($exceptions[$NRows])) {
                $expandRow = $exceptions[$NRows];
            }

            // Handle $NRows from 29 to 62 (follows formula)
            if ($NRows >= 29 && $NRows <= 62) {
                $expandRow = 63 - $NRows;
            }

            // Adjustments for language
            if ($language === 'cn') {
                $expandRow -= ($NRows <= 21) ? 1 : 2;
            }

            // Adjustments for specific customer
            if ($F_CustomerCode === 'WH-ID-GZTS') {
                $expandRow -= ($language === 'en') ? 3 : 4;
            }
            
            // Fill the array
            for ($j = 0; $j < $expandRow; $j++) {
                $expanderdata[] = ['expander' => ""];
            }

            $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
            $TBS->MergeBlock('m', $masterdata);
            $TBS->MergeBlock('a', $caption);
            $TBS->MergeBlock('b', $data);
            $TBS->MergeBlock('c', $bottomdata);
            $TBS->MergeBlock('d', $expanderdata);
            
            // ✅ Output file name
            $outputFileName = $soNumber . '.' . $format;
            
            // ✅ Single download: immediately download and exit
            if ($isSingleDownload) {
                $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
                exit;
            }
            
            // ✅ Multiple downloads: save to string and add to zip
            $TBS->Show(OPENTBS_STRING);
            $zip->FileAdd($outputFileName, $TBS->Source, TBSZIP_STRING);
        }
        
        // ✅ For multiple files, flush the zip
        if (!$isSingleDownload) {
            $zip->Flush(TBSZIP_DOWNLOAD, 'SelectedCustomerSalesOrder.zip');
        }
    }
    public function PurchaseOrder($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $masters = POrder_master::with([
            'supplier:id,suppliername_en,suppliername_cn,supplier_code',
            'details.product:id,product_code,product_title_en,product_title_cn',
            'invoiceStatus:id,postatus_en,postatus_cn',
        ])->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
        ->orderByDesc('id')->get();

        $captionsArr = array();
        $captionsArr[] = array(
            'PONumber'=>$this->ISGlobal("PO Number",$language),
            'PODate'=>$this->ISGlobal("PO Date",$language),
            'Supplier'=>$this->ISGlobal("Supplier",$language),
            'SupplierName'=>$this->ISGlobal("Supplier Name",$language),
            'Currency'=>$this->ISGlobal("Currency",$language),
            'Deposit'=>$this->ISGlobal("Deposit",$language),
            'POAmount'=>$this->ISGlobal("PO Amount",$language),
            'ExRate'=>$this->ISGlobal("Ex Rate",$language),
            'DepositPV'=>$this->ISGlobal("Deposit PV",$language),
            'Status'=>$this->ISGlobal("Status",$language),
        );

        $TotalPOAmount = 0;
        $TotalDeposit = 0;
        $ArrayCurrency = array();
        $data = array();

        foreach($masters as $item){
            $SupplierName = ($language == 'en' ? $item->supplier->suppliername_en ?? '' : $item->supplier->suppliername_cn ?? '');
            $Status = ($language == 'en' ? $item->invoiceStatus->postatus_en ?? '' : $item->invoiceStatus->postatus_cn ?? '');
            $data[] = array(
                'PONumber'=>$item->po_number,
                'PODate'=>$this->ConvertDateLanguage($item->po_date,$language),
                'Supplier'=>$item->supplier_code,
                'SupplierName'=>$SupplierName,
                'Currency'=>$item->currency,
                'POAmount'=>number_format($item->po_amount,2),
                'Deposit'=>number_format($item->deposit,2),
                'ExRate'=>$item->ex_rate,
                'DepositPV'=> collect($item->details)->pluck('deposit_pv')->filter()->unique()->implode(', '),
                'Status'=>$Status
            );
            $TotalPOAmount += $item->po_amount;
            $TotalDeposit += $item->deposit;
            array_push($ArrayCurrency,$item->currency);
        }

        $FTotal_POAmount = 0;
        $FTotal_Deposit = 0;
        $FCurrency = '';
        $resultArr = array_unique($ArrayCurrency);
        $countCurr = count($resultArr);

        if($countCurr == 1){
            $FCurrency = $resultArr[0];
            $FTotal_POAmount = number_format($TotalPOAmount,2);
            $FTotal_Deposit = number_format($TotalDeposit,2);
        }

        $TBS->VarRef['FCurrency'] = $FCurrency;
        $TBS->VarRef['FTotal_POAmount'] = $FTotal_POAmount;
        $TBS->VarRef['FTotal_Deposit'] = $FTotal_Deposit;

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $captionsArr);
        $TBS->MergeBlock('b', $data);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function DownloadSelectedSinglePO($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        $TBS->VarRef['T_PO'] = ($language == 'en' ? 'PURCHASE ORDER' : '订购单');
        $TBS->VarRef['TelNo'] = "+65910081684";

        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }
        
        $masters = POrder_master::with([
            'supplier',
            'details.product:id,product_code,product_title_en,product_title_cn',
            'invoiceStatus:id,postatus_en,postatus_cn',
        ])->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
        ->orderByDesc('id')->get();

        $templatePath = base_path('templates/ReportTemplate/PO_Report.odt');
      
        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        // ✅ Determine if we need to create a zip (multiple records) or single download
        $isSingleDownload = count($masters) === 1;
        
        // ✅ Only create zip if multiple records
        if (!$isSingleDownload) {
            $zip = new \clsTbsZip();
            $zip->CreateNew();
        }

        $F_CustomerCode = "";
        $ReferenceNo = array();
        $masterdata = array();
        $bottomdata = array();
        foreach($masters as $item){

            $GlobPONumber = $item->po_number;
            $POCurrency = $item->currency;

            $DeliveryDate = ($item->delivery_date == '' ? '' : $this->ConvertDateLanguage($item->delivery_date,$language));
            $DueDate = ($item->due_date == '' ? '' : $this->ConvertDateLanguage($item->due_date,$language));
            $PODate = $this->ConvertDateLanguage($item->po_date,$language);

            $ContactPerson = $item->supplier->contact_person_en ?? '';
            $Supplier = ($language === 'en' ? $item->supplier->suppliername_en ?? '' : $item->supplier->suppliername_cn ?? '');
            $Supplier_Address = ($language === 'en' ? $item->supplier->supplier_address_en ?? '' : $item->supplier->supplier_address_cn ?? '');
            $Postal_Code = $item->supplier->postal_code ?? '';
            $Fax = $item->supplier->fax ?? '';
            $DeliveryMethod = ($language === 'en' ? $item->supplier->deliveryMethod->courier_en ?? '' : $item->supplier->deliveryMethod->courier_cn ?? '');
            $ShippingTerms = ($language === 'en' ? $item->supplier->shippingTerms->shipping_terms_en ?? '' : $item->supplier->shippingTerms->shipping_terms_cn ?? '');
            $PaymentTerms = ($language === 'en' ? $item->supplier->paymentTerms->payment_terms_en ?? '' : $item->supplier->paymentTerms->payment_terms_cn ?? '');
            $Contact_Number = $item->supplier->contact_number ?? '';

            $Country_EN = $item->supplier->countryList?->country_en ?? '';
            $Country_CN = $item->supplier->countryList?->country_cn ?? '';
            $Country = ($language === 'en' ? $Country_EN : $Country_CN);

            $masterdata[] = array(
                'M_PONo'=>$item->po_number,
                'M_PODate'=>$PODate,
                'M_SupplierCode'=>$item->supplier->supplier_code ?? '',
                'M_ExRate'=>$item->ex_rate,
                'M_IssuedBy'=> '',
                'C_PONo'=>($language == 'en' ? 'PO Number' : '订购单号'),
                'C_Date'=>$this->ConvertDateLanguage('Date',$language),
                'C_Supplier'=>($language == 'en' ? 'Supplier' : '供应商编号'),
                'C_ExchangeRate'=>$this->ConvertDateLanguage('Exchange Rate',$language),
                'C_IssuedBy'=>$this->ConvertDateLanguage('IssuedBy',$language),
                'M_Contact_Person'=>$ContactPerson,
                'M_Supplier'=>$Supplier,
                'M_Supplier_Address'=>$Supplier_Address,
                'M_Postal_Code'=>$Postal_Code,
                'M_Country'=>$Country,
                'C_TelNo'=>$this->ConvertDateLanguage('Tel. No.',$language),
                'M_Contact_Number'=>$Contact_Number,
                'C_Fax'=>$this->ConvertDateLanguage('Fax No.',$language),
                'M_Fax'=>$Fax,
                'C_DeliveryMethod'=>$this->ConvertDateLanguage('Delivery Method',$language),
                'C_ShippingTerms'=>$this->ConvertDateLanguage('Shipping Terms',$language),
                'C_DeliveryDate'=>$this->ConvertDateLanguage('Delivery Date',$language),
                'C_PaymentTerms'=>$this->ConvertDateLanguage('Payment Terms',$language),
                'C_DueDate'=>$this->ConvertDateLanguage('Due Date',$language),
                'M_DeliveryMethod'=>$DeliveryMethod,
                'M_ShippingTerms'=>$ShippingTerms,
                'M_DeliveryDate'=>$DeliveryDate === 'NULL' ? "" : $DeliveryDate,
                'M_PaymentTerms'=>$PaymentTerms,
                'M_DueDate'=>$DueDate === 'NULL' ? "" : $DueDate,
            );
            $bottomdata[] = array(
                'C_Total'=>$this->ConvertDateLanguage('Total',$language),
                'M_Currency'=>$POCurrency,
                'M_TotalAmount'=>number_format($item->po_amount,2),
                'M_TotalExRateDiff'=>''
            );

            $TotalPOAmount = number_format($item->po_amount,2);

            $C_Total = $this->ConvertDateLanguage('Total',$language);
            $M_Currency = $POCurrency;
            $M_TotalAmount = $TotalPOAmount;

            $TBS->VarRef['C_Total'] = $C_Total;
            $TBS->VarRef['M_Currency'] = $M_Currency;
            $TBS->VarRef['M_TotalAmount'] = $M_TotalAmount;

            $caption = array();
            $caption[] = array(
                'caption1'=>$this->ISGlobal("Product Code",$language),
                'caption2'=>$this->ISGlobal("Description",$language),
                'caption3'=>$this->ISGlobal("Qty",$language),
                'caption4'=>$this->ISGlobal("Price",$language),
                'caption5'=>$this->ISGlobal("Amount",$language),
            );

            $data = array();
            $NRows = 0;
            $TotalAmount = 0;
            foreach ($item->details as $detail) {
                $NRows = $NRows + 1; 
                $TotalAmount = $TotalAmount + $detail->total;
                if ($language == 'en'){
                    $Description = $detail->product->product_title_en ?? '';
                }
                else{
                    $Description = $detail->product->product_title_cn ?? '';
                }
                $data[] = array(
                    'ItemCode'=>$detail->product->product_code ?? '',
                    'Description'=>$Description,
                    'Qty'=>$detail->qty,
                    'Curr1'=>$POCurrency,
                    'Price'=>$POCurrency.' '.number_format($detail->price,2),
                    'Curr2'=>$POCurrency,
                    'Total'=>$POCurrency.' '.number_format($detail->total,2)
                );
            }

            $expanderdata = array();
            $expandRow = 0;
            if ($NRows < 13 ){
                $expandRow = 12 - $NRows;
            }
            else if ($NRows > 12 && $NRows < 26){
                $expandRow = (25 - $NRows) + 27;  
            }
            else{
                $RowsonPage = $NRows - 25;
                if ($RowsonPage > 42){
                    while ($RowsonPage > 42){
                        $RowsonPage = $RowsonPage - 42;
                    }
                }
                if ($RowsonPage < 29){
                    $RowsonPage = 28 - $RowsonPage;
                }
                else{
                    $RowsonPage = (42 - $RowsonPage) + 26;
                }
                $expandRow = $RowsonPage; 
            }
                    
            for ($j=0; $j<$expandRow; $j++){
                $expanderdata[] = array('expander'=>"");
            }

            $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
            $TBS->MergeBlock('m', $masterdata);
            $TBS->MergeBlock('a', $caption);
            $TBS->MergeBlock('b', $data);
            $TBS->MergeBlock('c', $bottomdata);
            $TBS->MergeBlock('d', $expanderdata);
            
            // ✅ Output file name
            $outputFileName = $GlobPONumber . '.' . $format;
            
            // ✅ Single download: immediately download and exit
            if ($isSingleDownload) {
                $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
                exit;
            }
            
            // ✅ Multiple downloads: save to string and add to zip
            $TBS->Show(OPENTBS_STRING);
            $zip->FileAdd($outputFileName, $TBS->Source, TBSZIP_STRING);
        }
        
        // ✅ For multiple files, flush the zip
        if (!$isSingleDownload) {
            $zip->Flush(TBSZIP_DOWNLOAD, 'SelectedPO.zip');
        }
    }
    public function PO_Report_By_Supplier($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $masters = POrder_master::with([
            'supplier:id,suppliername_en,suppliername_cn,supplier_code',
            'details.product:id,product_code,product_title_en,product_title_cn',
            'invoiceStatus:id,postatus_en,postatus_cn',
        ])->whereIn('supplier_id',$ids)
        ->whereIn('postatus_id',[3,4])
        ->orderByDesc('id')->get();

        $first = $masters->first();
        $TBS->VarRef->supplier->suppliername_en = $first->supplier->suppliername_en ?? "";
        $TBS->VarRef['SupplierCode'] = $first->supplier->supplier_code ?? "";
        $SupplierCode = $first->supplier->supplier_code ?? "";

        $dataMaster = array();

        foreach($masters as $item){
            $PONumber = $item->po_number;
            $GrandTotal = 0;
            $GrandDeposit = 0;
            $dataDetail = array();

            $count = 0;
            foreach($item->details as $detail){
                $ProductTitle = ($language == 'en' ? $detail->product->product_title_en ?? '' : $detail->product->product_title_cn ?? '');
                $_PODate = "";
                $_PONumber = "";
                if($count == 0){
                    $_PODate = $this->ConvertDateLanguage($item->po_date,$language);
                    $_PONumber = $detail->po_number;
                }
                $dataDetail[] = array(
                    'data1' => $detail->product->product_code ?? '',
                    'data2' => $ProductTitle,
                    'data3' => $detail->qty,
                    'data4' => number_format($detail->price,2),
                    'data5' => $this->ConvertDateLanguage($detail->product->release_date,$language),
                    'data6' => number_format($detail->deposit,2),
                    'data7' => $_PODate,
                    'data8' => $_PONumber,
                );
                $GrandTotal += $detail->total;
                $GrandDeposit += $detail->deposit;
                $count++;
            }

            $dataDetail[] = array(
                'data1' => "",
                'data2' => "",
                'data3' => $this->ISGlobal('Total',$language),
                'data4' => number_format($GrandTotal,2),
                'data5' => "",
                'data6' => number_format($GrandDeposit,2),
                'data7' => "",
                'data8' => "",
            );

            $dataMaster[] = array(
                'text1' => $this->ISGlobal('PO Date',$language),
                'text2' => $this->ISGlobal('PO Number',$language),
                'text3' => $this->ISGlobal('Supplier Code',$language),
                'text4' => $this->ISGlobal('Supplier Name',$language),
                'text5' => $this->ISGlobal('Ex Rate',$language),

                '2text1' => $this->ISGlobal('Product Code',$language),
                '2text2' => $this->ISGlobal('Product Name',$language),
                '2text3' => $this->ISGlobal('Qty',$language),
                '2text4' => $this->ISGlobal('Price',$language),
                '2text5' => $this->ISGlobal('Release Date',$language),
                '2text6' => $this->ISGlobal('Deposit',$language),

                'data1' => $this->ConvertDateLanguage($item->po_date,$language),
                'data2' => $item->po_number,
                'data3' => $item->supplier->supplier_code ?? '',
                'data4' => $item->supplier->supliername_en ?? '',
                'data5' => $item->ex_rate,
                'data6' => $dataDetail
            );
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('myBlock', $dataMaster);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function PODepositPaid($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $exclude = ['PO-211118-008','PO-210820-005','PO-210716-007'];
        $masters = POrder_detail::with([
            'product',
            'depositVoucher', // ✅ Relationship on POrder_detail
            'poMaster.supplier',
            'poMaster.bankList',
            'poMaster.creditSupplier' // ✅ (assuming this one exists on poMaster)
        ])
        ->when(!empty($ids), fn($q) => $q->whereIn('po_number', $ids))
        ->where('deposit', '>', 0)
        ->where('receive_qty', 0)
        ->whereNotIn('po_number', $exclude);

        $captionsArr = array();
        $captionsArr[] = array(
            'cap1'=>$this->ISGlobal("PV Date",$language),
            'cap2'=>$this->ISGlobal("PO Number",$language),
            'cap3'=>$this->ISGlobal("PV No",$language),
            'cap4'=>$this->ISGlobal("Supplier",$language),
            'cap5'=>$this->ISGlobal("Ex Rate",$language),
            'cap6'=>$this->ISGlobal("Deposit",$language),
            'cap7'=>$this->ISGlobal("Base Currency",$language),
        );

        $Total = 0;
        $data = array();
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');

        $details = $masters->get();

        // Grouping and aggregation logic same as before:
        $grouped = $details->groupBy('po_number');
        $data = $grouped->map(function ($items, $poNumber) use ($language, $baseCurrency) {
            $first = $items->first();
            return [
                'data1'=>$this->ConvertDateLanguage(optional($first->depositVoucher)->pv_date,$language),
                'data2'=>$poNumber,
                'data3'=>$items->pluck('deposit_pv')->filter()->max() ?? '',
                'data4'=>optional($first->poMaster->supplier)->supplier_code ?? '',
                'data5'=>optional($first->poMaster->supplier)->suppliername_en ?? '',
                'data6'=>$items->max('ex_rate'),
                'data7'=>$first->currency,
                'data8'=>number_format($items->sum('deposit'),2),
                'data9'=>$baseCurrency,
                'data10'=>number_format($items->sum('base_deposit'),2),
            ];
        })->values();

        $TBS->VarRef['TextTotal'] = $this->ISGlobal("Total",$language);
        $TBS->VarRef['FTotal'] = number_format($details->sum('base_deposit'), 2);

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $captionsArr);
        $TBS->MergeBlock('b', $data);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function SupplierInvoice($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $masters = Accounts_payable_master::with([
            'supplier:id,suppliername_en,suppliername_cn,supplier_code',
            'apDetails.product:id,product_code,product_title_en,product_title_cn',
            'invoiceStatus:id,status_value_en,status_value_cn',
        ])->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
        ->orderByDesc('id')->get();

        $captionsArr = array();
        $captionsArr[] = array(
            'APDate'=>$this->ISGlobal("AP Date",$language),
            'APInvoiceNo'=>$this->ISGlobal("Invoice No",$language),
            'PVNo'=>$this->ISGlobal("PVoucherNo",$language),
            'Supplier'=>$this->ISGlobal("Supplier",$language),
            'SupplierName'=>$this->ISGlobal("Supplier Name",$language),
            'Currency'=>$this->ISGlobal("Currency",$language),
            'Total'=>$this->ISGlobal("Total",$language),
            'InvoiceStatus'=>$this->ISGlobal("Invoice Status",$language),
        );

        $data = array();

        foreach($masters as $item){
            $SupplierName = ($language == 'en' ? $item->supplier->suppliername_en ?? '' : $item->supplier->suppliername_cn ?? '');
            $InvoiceStatus = ($language == 'en' ? $item->invoiceStatus->status_value_en ?? '' : $item->invoiceStatus->status_value_cn ?? '');

            $pv = Payment_voucher_master::selectRaw("COALESCE(pv_date, '') as pv_date,pv_number")
                ->whereRaw("FIND_IN_SET(?, REPLACE(invoice_no, '|', ',')) > 0", [$item->ap_number])
                ->first();

            $data[] = array(
                'APDate'=> $this->ConvertDateLanguage($item->ap_date,$language),
                'APInvoiceNo'=>$item->ap_number,
                'PVNo'=>$pv?->pv_number,
                'Supplier'=>$item->supplier->supplier_code ?? '',
                'SupplierName'=>$SupplierName,
                'Currency'=>$item->currency,
                'Total'=>number_format($item->total,2),
                'InvoiceStatus'=>$InvoiceStatus
            );
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $captionsArr);
        $TBS->MergeBlock('b', $data);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function DSSupplierSingleInvoices_Report($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        $TBS->VarRef['T_PO'] = ($language == 'en' ? 'PURCHASE ORDER' : '订购单');
        $TBS->VarRef['TelNo'] = "+65910081684";

        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }
        
        $masters = Accounts_payable_master::with([
            'supplier',
            'apDetails.product:id,product_code,product_title_en,product_title_cn',
            'apDetails.service:id,service_code,description_en,description_cn',
            'invoiceStatus:id,status_value_en,status_value_cn',
        ])->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
        ->orderByDesc('id')->get();

        $templatePath = base_path('templates/ReportTemplate/PO_Report.odt');
      
        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        // ✅ Determine if we need to create a zip (multiple records) or single download
        $isSingleDownload = count($masters) === 1;
        
        // ✅ Only create zip if multiple records
        if (!$isSingleDownload) {
            $zip = new \clsTbsZip();
            $zip->CreateNew();
        }

        $F_CustomerCode = "";
        $ReferenceNo = array();
        $masterdata = array();
        $bottomdata = array();
        foreach($masters as $item){

            $APInvoiceNo = $item->ap_number;
            $POCurrency = $item->currency;

            $Supplier_Address = ($language === 'en' ? $item->supplier->supplier_address_en : $item->supplier->supplier_address_cn);

            $Country_EN = $item->supplier->countryList?->country_en ?? '';
            $Country_CN = $item->supplier->countryList?->country_cn ?? '';
            $Country = ($language === 'en' ? $Country_EN : $Country_CN);
            $DeliveryMethod = ($language === 'en' ? $item->supplier->deliveryMethod->courier_en ?? '' : $item->supplier->deliveryMethod->courier_cn ?? '');
            $ShippingTerms = ($language === 'en' ? $item->supplier->shippingTerms->shipping_terms_en ?? '' : $item->supplier->shippingTerms->shipping_terms_cn ?? '');
            $PaymentTerms = ($language === 'en' ? $item->supplier->paymentTerms->payment_terms_en ?? '' : $item->supplier->paymentTerms->payment_terms_cn ?? '');
            $masterdata[] = array(
                'M_PONo'=>$item->ap_number,
                'M_PODate'=>$this->ConvertDateLanguage($item->ap_date,$language),
                'M_SupplierCode'=>$item->supplier->supplier_code ?? '',
                'M_ExRate'=>$item->ex_rate,
                'M_IssuedBy'=>"",
                'C_PONo'=>$this->ISGlobal('A/P Invoice No.',$language),
                'C_Date'=>$this->ISGlobal('Date',$language),
                'C_Supplier'=>$this->ISGlobal('Supplier',$language),
                'C_ExchangeRate'=>$this->ISGlobal('Exchange Rate',$language),
                'C_IssuedBy'=>$this->ISGlobal('IssuedBy',$language),
                'M_Contact_Person'=> $item->supplier->contact_person_en ?? '',
                'M_Supplier'=> $item->supplier->suppliername_en ?? '',
                'M_Supplier_Address'=>$Supplier_Address,
                'M_Postal_Code'=> $item->supplier->postal_code ?? '',
                'M_Country'=>$Country,
                'C_TelNo'=>$this->ISGlobal('Tel. No.',$language),
                'M_Contact_Number'=> $item->supplier->contact_number ?? '',
                'C_Fax'=>$this->ISGlobal('Fax No.',$language),
                'M_Fax'=> $item->supplier->fax ?? '',
                'C_DeliveryMethod'=>$this->ISGlobal('Delivery Method',$language),
                'C_ShippingTerms'=>$this->ISGlobal('Shipping Terms',$language),
                'C_DeliveryDate'=>$this->ISGlobal('Delivery Date',$language),
                'C_PaymentTerms'=>$this->ISGlobal('Payment Terms',$language),
                'C_DueDate'=>$this->ISGlobal('Due Date',$language),
                'M_DeliveryMethod'=>$DeliveryMethod,
                'M_ShippingTerms'=>$ShippingTerms,
                'M_DeliveryDate'=>$this->ConvertDateLanguage($item->delivery_date,$language),
                'M_PaymentTerms'=>$PaymentTerms,
                'M_DueDate'=>$this->ConvertDateLanguage($item->due_date,$language)
            );
                            
            $bottomdata[] = array(
                'C_Total'=>$this->ISGlobal('Total',$language),
                'M_Currency'=>$POCurrency,
                'M_TotalAmount'=>number_format($item->sub_total,2),
                'M_TotalExRateDiff'=>''
            );
            $T_PO = ($language == 'en' ? 'PURCHASE ORDER' : '订购单');
            $C_Total = $this->ISGlobal('Total',$language);
            $M_Currency = $POCurrency;
            $M_TotalAmount = number_format($item->sub_total,2);

            $TBS->VarRef['C_Total'] = $C_Total;
            $TBS->VarRef['M_Currency'] = $M_Currency;
            $TBS->VarRef['M_TotalAmount'] = $M_TotalAmount;

            $caption = array();
            $caption[] = array(
                'caption1'=>$this->ISGlobal("Product Code",$language),
                'caption2'=>$this->ISGlobal("Description",$language),
                'caption3'=>$this->ISGlobal("Qty",$language),
                'caption4'=>$this->ISGlobal("Price",$language),
                'caption5'=>$this->ISGlobal("Amount",$language),
                'caption6'=>$this->ISGlobal("PO Number",$language),
            );

            $data = array();
            $NRows = 0;
            $TotalAmount = 0;
            foreach ($item->apDetails as $detail) {
				$NRows = $NRows + 1; 
				$TotalAmount = $TotalAmount + $detail->total;
				if ($language == 'en'){
					$Description = $detail->product->product_title_en;
				}
				else{
					$Description = $detail->product->product_title_cn;
				}
				$data[] = array(
					'ItemCode'=>$detail->product->product_code,
					'PONumber'=>$detail->po_number,
					'Description'=>$Description,
					'Qty'=>$detail->qty,
					'Curr1'=>$POCurrency,
					'Price'=>$POCurrency.' '.number_format($detail->price,2),
					'Curr2'=>$POCurrency,
					'Total'=>$POCurrency.' '.number_format($detail->total,2)
				);
            }

            $expanderdata = array();
            $expandRow = 0;
            if ($NRows < 20 ){
                $expandRow = 21 - $NRows;
            }
            else if ($NRows > 21 && $NRows < 36){
                $expandRow = (35 - $NRows) + 24;  
            }
            else{
                $RowsonPage = $NRows - 20;
                if ($RowsonPage > 42){
                    while ($RowsonPage > 42){
                        $RowsonPage = $RowsonPage - 42;
                    }
                }
                        
                if ($RowsonPage < 29){
                    $RowsonPage = 28 - $RowsonPage;
                }
                else{
                    $RowsonPage = (42 - $RowsonPage) + 26;
                }
                $expandRow = $RowsonPage; 
            }
                    
            for ($j=0; $j<$expandRow; $j++){
                $expanderdata[] = array('expander'=>"");
            }

            $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
            $TBS->MergeBlock('m', $masterdata);
            $TBS->MergeBlock('a', $caption);
            $TBS->MergeBlock('b', $data);
            $TBS->MergeBlock('c', $bottomdata);
            $TBS->MergeBlock('d', $expanderdata);
            
            // ✅ Output file name
            $outputFileName = $APInvoiceNo . '.' . $format;
            
            // ✅ Single download: immediately download and exit
            if ($isSingleDownload) {
                $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
                exit;
            }
            
            // ✅ Multiple downloads: save to string and add to zip
            $TBS->Show(OPENTBS_STRING);
            $zip->FileAdd($outputFileName, $TBS->Source, TBSZIP_STRING);
        }
        
        // ✅ For multiple files, flush the zip
        if (!$isSingleDownload) {
            $zip->Flush(TBSZIP_DOWNLOAD, 'SelectedSupplierInvoices.zip');
        }
    }
    public function PaidItemNotReceived($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $masters = Accounts_payable_details::with([
            'product',
            'apMaster.supplier',
            'apMaster.invoiceStatus'
        ])
        ->join('t_ap_master as B', 'B.ap_number', '=', 't_ap_detail.ap_number')
        ->where('t_ap_detail.product_type', 0)
        ->when(!empty($ids), fn($q) => $q->whereIn('B.id', $ids)) // ✅ fixed here
        ->where('B.invoice_status_id', 1);

        // Get all AP invoice details grouped by ap_number
        $apDetails = $masters->select('t_ap_detail.*')
            ->orderBy('B.id', 'desc')
            ->get()
            ->groupBy('ap_number');

        // Step 2: Get PO details for comparison (F.ReceiveQty < A.Qty check)
        $poNumbers = $apDetails->flatten()->pluck('po_number')->unique();
        $productIds = $apDetails->flatten()->pluck('product_id')->unique();

        $poDetails = POrder_detail::whereIn('po_number', $poNumbers)
            ->whereIn('product_id', $productIds)
            ->get()
            ->keyBy(function($item) {
                return $item->po_number . '_' . $item->product_id;
            });

        // Step 3: Get Payment Voucher data (LEFT JOIN with FIND_IN_SET logic)
        $apNumbers = $apDetails->keys();
        $paymentVouchers = Payment_voucher_master::whereRaw("FIND_IN_SET(?, REPLACE(invoice_no, '|', ',')) <> 0", [$apNumbers->first()])
            ->orWhere(function($q) use ($apNumbers) {
                foreach($apNumbers as $apNo) {
                    $q->orWhereRaw("FIND_IN_SET(?, REPLACE(invoice_no, '|', ',')) <> 0", [$apNo]);
                }
            })
            ->get()
            ->keyBy('pv_number');

        $captionsArr = array();
        $captionsArr[] = array(
            'cap1'=>$this->ISGlobal("PV Date",$language),
            'cap2'=>$this->ISGlobal("A/P Invoice No.",$language),
            'cap3'=>$this->ISGlobal("PV No",$language),
            'cap4'=>$this->ISGlobal("Supplier",$language),
            'cap5'=>$this->ISGlobal("PO Number",$language),
            'cap6'=>$this->ISGlobal("Total",$language),
            'cap7'=>$this->ISGlobal("Default Currency",$language),
        );

        $Total = 0;
        $data = array();
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        $data = $apDetails->map(function ($items, $apNumber) use ($poDetails, $paymentVouchers,$language,$baseCurrency) {
            $firstItem = $items->first();
            $apMaster = $firstItem->apMaster;

            // Aggregate product codes and descriptions
            $itemCodes = [];
            $descriptions = [];
            $descriptionsCN = [];
            $poNumbers = [];
            $remPOAmount = 0;
            $baseRemPOAmount = 0;

            $hasValidItems = false;

            foreach ($items as $item) {
                $key = $item->po_number . '_' . $item->product_id;
                $poDetail = $poDetails->get($key);

                // Check: F.ReceiveQty < A.Qty
                if ($poDetail && $poDetail->receive_qty < $item->qty) {
                    $hasValidItems = true;
                    
                    // Calculate (A.Qty - F.ReceiveQty) * A.Price
                    $qtyDiff = $item->qty - $poDetail->receive_qty;
                    $remPOAmount += $qtyDiff * $item->price;
                    $baseRemPOAmount += $qtyDiff * $item->price * $item->ex_rate;

                    if ($item->product) {
                        $itemCodes[] = $item->product->product_code;
                        $descriptions[] = $item->product->product_title_en;
                        $descriptionsCN[] = $item->product->product_title_cn;
                    }
                    $poNumbers[] = $item->po_number;
                }
            }

            // Filter: WHERE F.ReceiveQty < A.Qty (if no valid items, return null)
            if (!$hasValidItems || $remPOAmount <= 0) {
                return null;
            }

            // Find matching payment voucher
            $pv = null;
            foreach ($paymentVouchers as $voucher) {
                $invoiceNos = str_replace('|', ',', $voucher->invoice_no ?? '');
                if (strpos($invoiceNos, $apNumber) !== false) {
                    $pv = $voucher;
                    break;
                }
            }
            $suppliername_en = $apMaster->supplier ? $apMaster->supplier->suppliername_en : '';
            $suppliername_cn = $apMaster->supplier ? $apMaster->supplier->suppliername_cn : '';
            $suppliername_cn = ($suppliername_cn === '' ? $suppliername_en : $suppliername_cn);
            $SupplierName = ($language === 'en' ? $suppliername_en : $suppliername_cn);
            return [
                'data1'=>$this->ConvertDateLanguage($pv ? $pv->pv_date : '',$language),
                'data2'=>$apNumber,
                'data3'=>$pv ? $pv->pv_number : '',
                'data4'=>$apMaster->supplier ? $apMaster->supplier->supplier_code : '',
                'data5'=>implode(',', array_unique($poNumbers)),
                'data6'=>number_format($remPOAmount,2),
                'data7'=>number_format($baseRemPOAmount,2),
                'data8'=>$SupplierName,
                'data9'=>$apMaster->currency,
                'data10'=>$baseCurrency,

            ];
        })->filter()->values();

        $totalBaseRemPOAmount = $data->sum(function ($item) {
            return floatval(str_replace(',', '', $item['data7']));
        });

        $TBS->VarRef['TextTotal'] = $this->ISGlobal("Total",$language);
        $TBS->VarRef['FCurrency'] = $baseCurrency;
        $TBS->VarRef['FTotal'] = number_format($totalBaseRemPOAmount, 2);

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $captionsArr);
        $TBS->MergeBlock('b', $data);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function UnpaidItemReceive($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

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
            ->where('a.imported', 0);

        $builder->groupBy('a.grn_no')
            ->orderByDesc('a.grn_no');

        $allGrouped = $builder->get();

        $captionsArr = array();
        $captionsArr[] = array(
            'cap1'=>$this->ISGlobal("Received Date",$language),
            'cap2'=>$this->ISGlobal("Supplier",$language),
            'cap3'=>$this->ISGlobal("GRN No",$language),
            'cap4'=>$this->ISGlobal("Total",$language),
            'cap5'=>$this->ISGlobal("Deposit",$language),
            'cap6'=>$this->ISGlobal("Balance",$language),
            'cap7'=>$this->ISGlobal("Default Currency",$language),
        );
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');

        $Total = 0;
        $data = array();
        foreach($allGrouped as $item){
            $Balance = $item->total - $item->deposit;
            $DefaultCurrency = $Balance * $item->ex_rate;
            $BaseBalance = $DefaultCurrency;
            $data[] = array(
                'data1'=>$this->ConvertDateLanguage($item->grn_date,$language),
                'data2'=>$item->supplier_code,
                'data3'=>$item->grn_no,
                'data4'=>number_format($item->total,2),
                'data5'=>number_format($item->deposit,2),
                'data6'=>number_format($Balance,2),
                'data7'=>number_format($BaseBalance,2),
                'data8'=>$item->suppliername_en,
                'data9'=>$baseCurrency,
                'data10'=>$item->currency,
            );
            $Total += $BaseBalance;
        }

        $TBS->VarRef['TextTotal'] = $this->ISGlobal("Total",$language);
        $TBS->VarRef['FCurrency'] = $baseCurrency;
        $TBS->VarRef['FTotal'] = number_format($Total, 2);

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $captionsArr);
        $TBS->MergeBlock('b', $data);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function AllocationList($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $query = Grn_details::with(['product'])
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
            ->orderByRaw("DATE_FORMAT(STR_TO_DATE(grn_date, '%M %d %Y'), '%Y%m%d') DESC");

        $captionsArr = array();
        $captionsArr[] = array(
            'APDate'=>$this->ISGlobal("AP Date",$language),
            'APInvoiceNo'=>$this->ISGlobal("Invoice No",$language),
            'PVNo'=>$this->ISGlobal("PVoucherNo",$language),
            'Supplier'=>$this->ISGlobal("Supplier",$language),
            'SupplierName'=>$this->ISGlobal("Supplier Name",$language),
            'Currency'=>$this->ISGlobal("Currency",$language),
            'Total'=>$this->ISGlobal("Total",$language),
            'InvoiceStatus'=>$this->ISGlobal("Invoice Status",$language),
        );

        $header0 = array();
        $header0[] = array(
            'cap1'=>$this->ISGlobal("GRN No",$language),
            'cap2'=>$this->ISGlobal("GRN Date",$language),
            'cap3'=>$this->ISGlobal("Ware House",$language),
            'cap4'=>$this->ISGlobal("Product",$language),
            'cap5'=>$this->ISGlobal("Received Qty",$language),
            'cap6'=>$this->ISGlobal("Allocated Qty",$language),
        );

        $header1 = array();
        $header1[] = array(
            'cap1'=>$this->ISGlobal("Customer Code",$language),
            'cap2'=>$this->ISGlobal("Customer Name",$language),
            'cap3'=>$this->ISGlobal("Qty",$language),
            'cap4'=>$this->ISGlobal("Shipping Status",$language),
            'cap5'=>$this->ISGlobal("SO Number",$language),
            'cap6'=>$this->ISGlobal("Invoice No",$language),
            'cap7'=>$this->ISGlobal("Ware House",$language),
        );

        $details = array();
        $mainBlock = array();

        $countH0 = 0;
        $TeamList = [];

        $result = $query->get();

        foreach ($result as $list) {
            $ProductTitle = ($language == 'en' ? $list->product->product_title_en ?? '' : $list->product->product_title_cn ?? '');
            $ItemCode = $list->product->product_code ?? '';

            $TeamList[$countH0] = [
                'data0' => '',
                'data1' => $list->grn_no,
                'data2' => $this->ConvertDateLanguage($list->grn_date, $language),
                'data3' => $list->warehouse,
                'data4' => $ItemCode,
                'data5' => $list->qty,
                'data6' => $list->allocation,
                'data7' => $ProductTitle,
                'matches' => [],
            ];

            $allocDetails = Inventory_allocation::with(['customer', 'product', 'shippingStat'])
                ->where('product_id', $list->product_id)
                ->where('warehouse', $list->warehouse)
                ->orderBy('id', 'desc')
                ->get();

            foreach ($allocDetails as $dtadtls) {
                $Name = ($language == 'en' ? $dtadtls->customer->account_name_en ?? '' : $dtadtls->customer->account_name_cn ?? '');

                if (empty($dtadtls->invoice_no)) {
                    $Shipping_Stat = $this->ISGlobal('N.A.', $language);
                    $dtadtls->invoice_no = ($language == 'en' ? $this->ISGlobal('N.A.', $language) : '暂无信息');
                } else {
                    $Shipping_StatId = $this->GetInvoiceShippingStatus($dtadtls->invoice_no);
                    $Shipping_Stat = ($language == 'en' ? $dtadtls->shippingStat->shipping_stat_en ?? '' : $dtadtls->shippingStat->shipping_stat_cn ?? '');

                    if (empty($dtadtls->shipping_stat_id)) {
                        $Shipping_Stat = 'N.A';
                    }
                }

                if (empty($dtadtls->so_number)) {
                    $dtadtls->so_number = ($language == 'en' ? $this->ISGlobal('N.A.', $language) : '暂无信息');
                }

                $TeamList[$countH0]['matches'][] = [
                    'data1' => $dtadtls->customer->customer_code ?? '',
                    'data2' => $Name,
                    'data3' => $dtadtls->qty,
                    'data4' => $Shipping_Stat,
                    'data5' => $dtadtls->so_number,
                    'data6' => $dtadtls->invoice_no,
                    'data7' => $dtadtls->warehouse,
                ];
            }

            $countH0++;
        }
        $TBS->VarRef['TeamList'] = $TeamList;
        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $header0);
        $TBS->MergeBlock('b', $header1 );
        $TBS->MergeBlock('mb','array','TeamList');
        $TBS->MergeBlock('sb','array','TeamList[%p1%][matches]');
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function GetInvoiceShippingStatus($InvoiceNo){
        $status = Shipout_items::where('invoice_no', $InvoiceNo)->value('status');
        return $status > 0 ? $status : 0;
    }
    public function CustomerInformation($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $masters = Customer::with(['countryList'])->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
        ->orderByDesc('id')->get();

        $captionsArr = array();
        $captionsArr[] = array(
            'AccountCode'=>$this->ISGlobal("Customer Code",$language),
            'Company'=>$this->ISGlobal("Company",$language),
            'AccountName'=>$this->ISGlobal("Customer Name",$language),
            'Email'=>$this->ISGlobal("Email Address",$language),
            'SalesPerson'=>$this->ISGlobal("Sales Person",$language),
            'Country'=>$this->ISGlobal("Country",$language),
            'TelNo'=>$this->ISGlobal("Tel No",$language),
        );

        $data = array();
        foreach($masters as $dtaitems){
            $Country = ($language == 'en' ? $dtaitems->countryList->country_en ?? '' : $dtaitems->countryList->country_cn ?? '');
            $Company = ($language == 'en' ? $dtaitems->company_en : $dtaitems->company_cn);
            $data[] = array(
                'AccountCode'=>$dtaitems->customer_code,
                'Company'=>$Company,
                'AccountName'=>$dtaitems->account_name_en,
                'Email'=>$dtaitems->email_address,
                'SalesPerson'=>$dtaitems->salesPerson->full_name ?? '',
                'Country'=>$Country,
                'TelNo'=>$dtaitems->tel_no
            );
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $captionsArr);
        $TBS->MergeBlock('b', $data);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function CustomerOrders($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $masters = Orders::with(['customer.countryList', 'customer.salesPerson', 'customer.source','product'])
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))->get();

        $first = $masters->first();

        $mHeader = array();
        $mHeader[] = array(
            'CustomerCode'=>$first->customer->customer_code ?? '',
            'CustomerName'=>$first->customer->account_name_en ?? '',
            'SalesPerson'=>$first->customer->salesPerson->full_name ?? '',
        );

        $captionsArr = array();
        $captionsArr[] = array(
            'CustomerCode'=>$this->ISGlobal("Customer Code",$language),
            'Customer'=>$this->ISGlobal("Customer",$language),
            'SalesPerson'=>$this->ISGlobal("Sales Person",$language),
            'OrderDate'=>$this->ISGlobal("Order Date",$language),
            'OrderProduct'=>$this->ISGlobal("Ordered Product",$language),
            'Currency'=>$this->ISGlobal("Currency",$language),
            'Price'=>$this->ISGlobal("Price",$language),
            'Qty'=>$this->ISGlobal("Qty",$language),
            'SubTotal'=>$this->ISGlobal("Sub Total",$language),
            'GrandTotal'=>$this->ISGlobal("Grand Total",$language),
            'TotalCost'=>$this->ISGlobal("Total Cost",$language),
            'TotalProfit'=>$this->ISGlobal("Total Profit",$language),
            'Deposit'=>$this->ISGlobal("Deposit",$language),
        );  
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        $data = array();
        foreach($masters as $dtaitems){
            $ProductTitle = ($language == 'en' ? $dtaitems->product->product_title_en ?? '' : $dtaitems->product->product_title_cn ?? '');
            $data[] = array(
                'CustomerCode'=>$dtaitems->customer->customer_code ?? '',
                'CustomerName'=>$dtaitems->customer->account_name_en ?? '',
                'OrderDate'=>$this->ConvertDateLanguage($dtaitems->order_date,$language),
                'ItemCode'=>$dtaitems->product->product_code ?? '',
                'ProductName'=>$ProductTitle,
                'SalesPerson'=>$dtaitems->customer->salesPerson->full_name ?? '',
                'Currency'=>$dtaitems->currency,
                'BaseCurrency'=>$baseCurrency,
                'Price'=>number_format($dtaitems->price,2),
                'Qty'=>$dtaitems->qty,
                'SubTotal'=>number_format($dtaitems->total,2),
                'GrandTotal'=>number_format($dtaitems->base_total,2),
                'TotalCost'=>number_format($dtaitems->e_cost_total,2),
                'TotalProfit'=>number_format($dtaitems->e_profit,2),
                'Deposit'=>number_format($dtaitems->item_deposit,2)
            );
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('m', $mHeader);
        $TBS->MergeBlock('a', $captionsArr);
        $TBS->MergeBlock('b', $data );
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function CustomerDep($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);
     
        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/CustomerDep_v2.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $customerCode = $ids;  // ensure this is properly bound/escaped

        $subqueryA = DB::table('t_rv_detail as A')
            ->leftJoin('m_products as B', 'B.id', '=', 'A.product_id')
            ->leftJoin('m_customer as C', 'C.id', '=', 'A.customer_id')
            ->leftJoin('t_orders as D', 'D.id', '=', 'A.order_id')
            ->select([
                'A.id',
                'A.order_id',
                DB::raw('A.rv_date AS transaction_date'),
                'A.rv_number',
                DB::raw('B.product_code AS product_code'),
                'B.product_title_en',
                'B.product_title_cn',
                'C.currency',
                'C.customer_code',
                'C.account_name_en',
                'A.qty',
                'A.amount AS item_deposit',
                'A.base_amount AS base_item_deposit',
                'A.ex_rate',
                DB::raw("'' AS ref_data"),
                DB::raw("'RV' AS `type`")
            ])
            ->where('A.account_code', 21301)
            ->whereIn('A.customer_id', $customerCode);

        $subqueryB = Account_customer_cn::with(['product', 'customer'])
            ->whereHas('customer', function ($q) use ($customerCode) {
                $q->whereIn('id', $customerCode);
            })
            ->select([
                't_account_customer_cn.id',
                't_payment_orders_cn.order_id',
                't_account_customer_cn.transaction_date',
                DB::raw("CASE WHEN t_account_customer_cn.cr_detail_id = '' THEN t_account_customer_cn.ref_data ELSE t_account_customer_cn.cr_detail_id END AS rv_number"),
                DB::raw("CASE WHEN m_products.product_title_en IS NULL 
                    THEN t_account_customer_cn.particulars 
                    ELSE CONCAT(t_account_customer_cn.particulars,' ',m_products.product_title_en) END AS product_code"),
                'm_products.product_title_en',
                'm_products.product_title_cn',
                't_account_customer_cn.currency',
                'm_customer.customer_code',
                'm_customer.account_name_en',
                't_orders.qty',
                't_account_customer_cn.amount as item_deposit',
                't_account_customer_cn.base_amount as base_item_deposit',
                't_account_customer_cn.ex_rate as ex_rate',
                't_account_customer_cn.ref_data',
                DB::raw("'JV' AS `type`")
            ])
            ->leftJoin('m_products', 'm_products.id', '=', 't_account_customer_cn.product_id')
            ->leftJoin('m_customer', 'm_customer.id', '=', 't_account_customer_cn.customer_id')
            ->join('t_payment_orders_cn', 't_payment_orders_cn.account_customer_cn_id', '=', 't_account_customer_cn.id')
            ->join('t_orders', 't_orders.id', '=', 't_payment_orders_cn.order_id');

        // Now we union the two subqueries:
        $unioned = $subqueryA->unionAll($subqueryB);

        // Wrap the union as a derived table (sub‐select) so we can do grouping/aggregates:
        $finalQuery = DB::table(DB::raw("({$unioned->toSql()}) as a"))
            ->mergeBindings($unioned)
            ->select([
                DB::raw('GROUP_CONCAT(a.id) AS id'),
                DB::raw('GROUP_CONCAT(a.order_id) AS order_id'),
                DB::raw('MAX(a.transaction_date) AS transaction_date'),
                DB::raw('MAX(a.rv_number) AS rv_number'),
                DB::raw('GROUP_CONCAT(a.product_code) AS SearchItemCode'),
                DB::raw('GROUP_CONCAT(a.product_title_en) AS SearchProductTitle'),
                DB::raw('GROUP_CONCAT(a.product_title_cn) AS SearchProductTitleCN'),
                DB::raw('MAX(a.currency) AS currency'),
                DB::raw('MAX(a.customer_code) AS customer_code'),
                DB::raw('MAX(a.account_name_en) AS account_name_en'),
                DB::raw('SUM(a.qty) AS qty'),
                DB::raw('SUM(a.item_deposit) AS item_deposit'),
                DB::raw('SUM(a.base_item_deposit) AS base_item_deposit'),
                DB::raw('MAX(a.ex_rate) AS ex_rate'),
                DB::raw('GROUP_CONCAT(a.ref_data) AS ref_data'),
                DB::raw('MAX(a.`type`) AS `type`')
            ])
            ->whereNotNull('a.qty')
            ->groupBy('a.rv_number')
            ->orderByRaw("DATE_FORMAT(STR_TO_DATE(MAX(a.transaction_date), '%M %d %Y'), '%Y%m%d') DESC");


        // Then execute:
        $masters = $finalQuery->get();

        $captionsArr = array();
        $captionsArr[] = array(
            'Date'=>$this->ISGlobal("Date",$language),
            'Customer'=>$this->ISGlobal("Customer",$language),
            'CustomerCode'=>$this->ISGlobal("Customer Code",$language),
            'CustomerName'=>$this->ISGlobal("Customer Name",$language),
            'RVoucherNo'=>$this->ISGlobal("RV No",$language),
            'ProductCode'=>$this->ISGlobal("Product Code",$language),
            'ProductName'=>$this->ISGlobal("Product Name",$language),
            'Product'=>$this->ISGlobal("Product",$language),
            'Qty'=>$this->ISGlobal("Qty",$language),
            'DepositAmount'=>$this->ISGlobal("Deposit Amount",$language),
            'DefaultCurrency'=>$this->ISGlobal("Default Currency",$language),
            'Currency'=>$this->ISGlobal("Currency",$language),
            'ExRate'=>$this->ISGlobal("Ex Rate",$language),
            'UpdatedBy'=>$this->ISGlobal("Updated By",$language),
            'Deposit'=>$this->ISGlobal("Deposit",$language),
        );  
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        $data = array();
        foreach($masters as $dtaitems){

            $OrderID = $dtaitems->order_id;
            $RVoucherNo = $dtaitems->rv_number;
            $Type = $dtaitems->type;
            $Flag = ($Type == 'JV' ? 1 : 2);
            $Value = ($Type == 'JV' ? $OrderID : $RVoucherNo);

            $data[] = array(
                'Empty'=>'',
                'Date'=> $this->ConvertDateLanguage($dtaitems->transaction_date,$language),
                'CustomerCode'=>$dtaitems->customer_code,
                'CustomerName'=>$dtaitems->account_name_en,
                'RVoucherNo'=>$dtaitems->rv_number,
                'Qty'=>$dtaitems->qty,
                'DepositAmount'=>number_format($dtaitems->item_deposit,2),
                'DefaultCurrency'=>number_format($dtaitems->base_item_deposit,2),
                'Currency'=>$dtaitems->currency,
                'ExRate'=>$dtaitems->ex_rate,
                'BaseCurrency'=>$baseCurrency,
                'Details'=>$this->getDepositDetails($Value,$Flag,$language)
            );
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('main', 'array', $data );
        $TBS->MergeBlock('a', $captionsArr);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function getDepositDetails($value, $flag, $lang){
        $resultArray = [];

        switch ($flag) {
            case 1:
                // Get orders with matching IDs
                $ids = explode(',', $value); // assuming comma-separated IDs
                $orders = Orders::whereIn('id', $ids)
                    ->with('product') // assuming 'product' relation is defined
                    ->get();

                foreach ($orders as $order) {
                    $resultArray[] = [
                        'ItemCode' => $order->product_id ?? $order->product->product_code,
                        'ProductTitle' => $lang === 'en'
                            ? optional($order->product)->product_title_en
                            : optional($order->product)->product_title_cn,
                        'Currency' => $order->currency,
                        'Qty' => $order->qty,
                        'ItemDeposit' => $order->item_deposit,
                        'BaseItemDeposit' => $order->item_deposit * $order->ex_rate,
                    ];
                }
                break;

            case 2:
                // Get rvoucher_details by RVoucherNo
                $rvouchers = Receive_voucher_detail::where('rv_number', $value)
                    ->with('product') // assuming 'product' relation is defined
                    ->get();

                foreach ($rvouchers as $rv) {
                    $resultArray[] = [
                        'ItemCode' => $rv->product->product_code ?? '',
                        'ProductTitle' => $lang === 'en'
                            ? optional($rv->product)->product_title_en
                            : optional($rv->product)->product_title_cn,
                        'Currency' => $rv->currency,
                        'Qty' => $rv->qty,
                        'ItemDeposit' => $rv->amount,
                        'BaseItemDeposit' => $rv->base_amount,
                    ];
                }
                break;
        }

        return $resultArray;
    }
    public function CustomerProfitability($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/CustomerProfitability_v2.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $masters = Invoice_master::with(['invoiceStatus'])->when(!empty($ids), fn($q) => $q->whereIn('customer_id', $ids))->get();

        $first = $masters->first();

        $captionsArr = array();
        $captionsArr[] = array(
            'Customer'=>$this->ISGlobal("Customer",$language),
            'CustomerCode'=>$this->ISGlobal("Customer Code",$language),
            'CustomerName'=>$this->ISGlobal("Customer Name",$language),
            'InvoiceNo'=>$this->ISGlobal("Invoice No",$language),
            'TotalAmount'=>$this->ISGlobal("Total Amount",$language),
            'Currency'=>$this->ISGlobal("Currency",$language),
            'ExRate'=>$this->ISGlobal("Ex Rate",$language),
            'Date'=>$this->ISGlobal("Date",$language),
            'Qty'=>$this->ISGlobal("Qty",$language),
            'Price'=>$this->ISGlobal("Price",$language),
            'Total'=>$this->ISGlobal("Total",$language),
            'DefaultCurrency'=>$this->ISGlobal("Default Currency",$language),
            'Profitability'=>$this->ISGlobal("Profitability",$language),
            'InvoiceStatus'=>$this->ISGlobal("Invoice Status",$language),
            'ProductCode'=>$this->ISGlobal("Product Code",$language),
            'ProductName'=>$this->ISGlobal("Product Name",$language),
        );  
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        $data = array();
        foreach($masters as $dtaitems){
            $InvoiceStatus = ($language == 'en' ? $dtaitems->invoiceStatus->status_value_en ?? '' : $dtaitems->invoiceStatus->status_value_cn ?? '');
            $Profit = $dtaitems->base_sub_total - $dtaitems->sub_total_on_cost;
            $data[] = array(
                'Empty'=>'',
                'Date'=>$this->ConvertDateLanguage($dtaitems->invoice_date,$language),
                'InvoiceNo'=>$dtaitems->invoice_no,
                'Profitability'=>number_format($Profit,2),
                'Details'=>$this->CustomerProfitabilityDetails($dtaitems->invoice_no,$language)
            );
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('main', 'array', $data );
        $TBS->MergeBlock('a', $captionsArr);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function CustomerProfitabilityDetails($arInvoiceNo, $lang){
        $details = Invoice_detail::where('invoice_no', $arInvoiceNo)
            ->with('product')
            ->orderBy('id', 'asc')
            ->get();

        $resultArray = [];

        foreach ($details as $item) {
            $product = $item->product;

            $productTitle = $lang === 'en'
                ? optional($product)->product_title_en
                : optional($product)->product_title_cn;

            $itemCost = optional($product)->item_cost;
            $baseRowTotal = $item->base_row_total;
            $qty = $item->qty;

            $profitability = $itemCost !== null
                ? number_format(round($baseRowTotal - ($qty * $itemCost), 2), 2)
                : number_format($item->total, 2);

            $resultArray[] = [
                'ItemCode'       => $item->product->product_code ?? '',
                'ProductTitle'   => $productTitle,
                'Currency'       => $item->currency,
                'Deposit'        => number_format($item->deposit, 2),
                'Qty'            => $qty,
                'Price'          => number_format($item->price, 2),
                'Total'          => number_format($item->total, 2),
                'Profitability'  => $profitability,
            ];
        }

        return $resultArray;
    }
    public function CustomerOrderHistory($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/CustomerOrderHistory_v2.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $masters = Invoice_master::with(['invoiceStatus'])
            ->where('invoice_status_id',1)
            ->when(!empty($ids), fn($q) => $q->whereIn('customer_id', $ids))->get();

        $first = $masters->first();

        $captionsArr = array();
        $captionsArr[] = array(
            'Date'=>$this->ISGlobal("Date",$language),
            'InvoiceNo'=>$this->ISGlobal("AR Invoice No",$language),
            'ProductCode'=>$this->ISGlobal("Product Code",$language),
            'ProductName'=>$this->ISGlobal("Product Name",$language),
            'Deposit'=>$this->ISGlobal("Deposit",$language),
            'Qty'=>$this->ISGlobal("Qty",$language),
            'Price'=>$this->ISGlobal("Price",$language),
            'Total'=>$this->ISGlobal("Total",$language),
        );  
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        $data = array();
        foreach($masters as $dtaitems){
            $InvoiceStatus = ($language == 'en' ? $dtaitems->invoiceStatus->status_value_en ?? '' : $dtaitems->invoiceStatus->status_value_cn ?? '');
            $data[] = array(
                'Empty'=>'',
                'Date'=>$this->ConvertDateLanguage($dtaitems->invoice_date,$language),
                'InvoiceNo'=>$dtaitems->invoice_no,
                'Details'=>$this->CustomerOrderHistoryDetails($dtaitems->invoice_no,$language)
            );
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('main', 'array', $data );
        $TBS->MergeBlock('a', $captionsArr);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function CustomerOrderHistoryDetails($arInvoiceNo, $lang){
        $details = Invoice_detail::where('invoice_no', $arInvoiceNo)
            ->with(['product', 'productService'])
            ->get();

        $resultArray = [];

        foreach ($details as $item) {
            $product = $item->product;
            $service = $item->productService;

            // Handle fallbacks
            $productTitleEn = optional($product)->product_title_en ?? optional($service)->description_en;
            $productTitleCn = optional($product)->product_title_cn ?? (optional($service)->description_cn ?: optional($service)->description_en);

            $productTitle = $lang === 'en' ? $productTitleEn : $productTitleCn;

            $resultArray[] = [
                'ItemCode'      => $product->product_code ?? '',
                'ProductTitle'  => $productTitle,
                'Deposit'       => number_format($item->deposit, 2),
                'Qty'           => $item->qty,
                'Price'         => number_format($item->price, 2),
                'Total'         => number_format($item->total, 2),
            ];
        }

        return $resultArray;
    }
    public function CustomerGroupList($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $masters = Customer_group::with(['groupList'])->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
        ->orderByDesc('id')->get();

        $captionsArr = array();
        $captionsArr[] = array(
            'GroupName'=>$this->ISGlobal("Customer Code",$language),
            'Currency'=>$this->ISGlobal("Currency",$language),
            'NoOfAudience'=>$this->ISGlobal("No. of Audience",$language),
            'LastUpdate'=>$this->ISGlobal("Last Update",$language),
        );

        $captionsArr2 = array();
        $captionsArr2[] = array(
            'AccountCode'=>$this->ISGlobal("Account Code",$language),
            'AccountName'=>$this->ISGlobal("Account Name",$language),
            'Email'=>$this->ISGlobal("Email",$language),
            'SalesPerson'=>$this->ISGlobal("Sales Person",$language),
            'LastAddedDate'=>$this->ISGlobal("Last Added Date",$language),
        );

        $data = array();
        $details = array();
        foreach($masters as $dtaitems){
            $CustomerGroup = ($language == 'en' ? $dtaitems->customer_group_en ?? '' : $dtaitems->customer_group_cn ?? '');
            $groupList = $dtaitems->groupList;
            $details = [];
            foreach($groupList as $detail){
                $email_address =  $detail->customer->email_address ?? '';
                $customer_code =  $detail->customer->customer_code ?? '';
                $account_name_en =  $detail->customer->account_name_en ?? '';
                $account_name_cn =  $detail->customer->account_name_cn ?? '';
                $salesPerson = $detail->customer->salesPerson->full_name ?? '';
                $AccountName = ($language == 'en' ? $account_name_en : ($account_name_cn == '' || $account_name_cn == null ? $account_name_en : $account_name_en));
                $details[] = array(
                    'Customer_Group'=> '',
                    'AccountCode'=>$customer_code,
                    'AccountName'=>$account_name_en,
                    'Email'=>$email_address,
                    'SalesPerson'=>$salesPerson,
                    'LastAddedDate'=>$detail['updated_at']
                );
            }

            $data[] = array(
                'GroupName'=>$CustomerGroup,
                'Currency'=>$dtaitems->currency,
                'NoOfAudience'=> 0,
                'LastUpdate'=>$dtaitems['updated_at'],
                'SubArray' => $details
            );
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock( 'h1', $captionsArr);
        $TBS->MergeBlock( 'h2', $captionsArr2);
        $TBS->MergeBlock( 'd', $data);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function SupplierList($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $masters = Supplier::when(!empty($ids), fn($q) => $q->whereIn('id', $ids))->orderByDesc('id')->get();

        $captionsArr = array();
        $captionsArr[] = array(
            'SupplierCode'=>$this->ISGlobal("Supplier Code",$language),
            'SupplierName'=>$this->ISGlobal("Supplier Name",$language),
            'ContactPerson'=>$this->ISGlobal("Contact Person",$language),
            'ContactNumber'=>$this->ISGlobal("Contact Number",$language),
            'Email'=>$this->ISGlobal("Email",$language),
        );

        $data = array();
        foreach($masters as $dtaitems){
            $SupplierName = ($language == 'en' ? $dtaitems->suppliername_en : $dtaitems->suppliername_en);
            $ContactPerson = ($language == 'en' ? $dtaitems->contact_person_en : $dtaitems->contact_person_en);
            $data[] = array(
                'SupplierCode'=>$dtaitems->supplier_code,
                'SupplierName'=>$SupplierName,
                'ContactPerson'=>$ContactPerson,
                'ContactNumber'=>$dtaitems->contact_number,
                'Email'=>$dtaitems->email
            );
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $captionsArr);
        $TBS->MergeBlock('b', $data);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function SupplierInvoices($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/SupplierInvoices_v2.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $masters = Accounts_payable_master::with(['invoiceStatus','supplier'])
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
            ->orderByDesc('id')->get();

        $captionsArr = array();
        $captionsArr[] = array(
            'APDate'=>$this->ISGlobal("AP Date",$language),
            'InvoiceNo'=>$this->ISGlobal("A/P Invoice No.",$language),
            'Supplier'=>$this->ISGlobal("Supplier",$language),
            'PVoucherNo'=>$this->ISGlobal("PV No",$language),
            'SupplierName'=>$this->ISGlobal("Supplier Name",$language),
            'Total'=>$this->ISGlobal("Total",$language),
            'Status'=>$this->ISGlobal("Invoice Status",$language),
            'ProductCode'=>$this->ISGlobal("Product Code",$language),
            'ProductName'=>$this->ISGlobal("Product Name",$language),
            'PONumber'=>$this->ISGlobal("PO Number",$language),
            'GRNNo'=>$this->ISGlobal("GRN No",$language),
            'Qty'=>$this->ISGlobal("Qty",$language),
            'Price'=>$this->ISGlobal("Price",$language),
        );

        $data = array();
        foreach($masters as $dtaitems){
            $InvoiceStatus = ($language == 'en' ? $dtaitems->invoiceStatus->status_value_en ?? '' : $dtaitems->invoiceStatus->status_value_cn ?? '');
            $pvNumbers = Payment_voucher_master::where('invoice_no', $dtaitems->ap_number)
                ->pluck('pv_number')
                ->toArray();
            $pvString = implode(', ', $pvNumbers);
            $data[] = array(
                'Empty'=>'',
                'APDate'=>$this->ConvertDateLanguage($dtaitems->ap_date,$language),
                'InvoiceNo'=>$dtaitems->ap_number,
                'Currency'=>$dtaitems->currency,
                'Supplier'=>$dtaitems->supplier->supplier_code ?? '',
                'PVoucherNo'=>$pvString,
                'SupplierName'=>$dtaitems->supplier->suppliername_en ?? '',
                'Total'=>number_format($dtaitems->total,2),
                'Status'=>$InvoiceStatus,
                'Details'=>$this->SupplierInvoicesDetails($dtaitems->ap_number,$language)
            );
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
            $TBS->MergeBlock('main', 'array', $data );
            $TBS->MergeBlock('a', $captionsArr);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function SupplierInvoicesDetails($apNumber, $lang){
        $details = Accounts_payable_details::with(['product', 'service', 'grnDetail'])
            ->where('ap_number', $apNumber)
            ->orderBy('id', 'asc')
            ->get();

        $resultArray = [];

        foreach ($details as $item) {
            $product = $item->product;
            $service = $item->service;

            // Determine product or service title
            $productTitleEn = optional($product)->product_title_en ?? optional($service)->description_en;
            $productTitleCn = optional($product)->product_title_cn ?? (optional($service)->description_cn ?: optional($service)->description_en);
            $productType = $product ? 'Product' : 'Services';

            $productTitle = $lang === 'en' ? $productTitleEn : $productTitleCn;

            $resultArray[] = [
                'ItemCode'     => $item->product->product_code,
                'ProductTitle' => $productTitle,
                'PONumber'     => $item->po_number,
                'GRNNo'        => optional($item->grnDetail)->grn_no,
                'Qty'          => $item->qty,
                'Price'        => number_format($item->price, 2),
                'Total'        => number_format($item->total, 2),
                'ProductType'  => $productType,
                'ReceiveDate'  => $item->receive_date,
            ];
        }

        return $resultArray;
    }
    public function SupplierPrepaid($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/SupplierInvoices_v2.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }
        $captionsArr = array();
        $captionsArr[] = array(
            'Date'=>$this->ISGlobal("Date",$language),
            'PurchaseOrder'=>$this->ISGlobal("Purchase Order",$language),
            'PaymentVoucher'=>$this->ISGlobal("Payment Voucher",$language),
            'PaymentDate'=>$this->ISGlobal("Payment Date",$language),
            'Product'=>$this->ISGlobal("Product",$language),
            'ProductCode'=>$this->ISGlobal("Product Code",$language),
            'ProductName'=>$this->ISGlobal("Product Name",$language),
            'Qty'=>$this->ISGlobal("Qty",$language),
            'UnitPrice'=>$this->ISGlobal("Total PO Amount",$language),
            'TotalPOAmount'=>$this->ISGlobal("Total Prepaid Amount",$language),
            'Prepaid'=>$this->ISGlobal("Prepaid",$language),
            'Price'=>$this->ISGlobal("Price",$language),
            'Total'=>$this->ISGlobal("Total",$language),
            'Deposit'=>$this->ISGlobal("Deposit",$language),
        );

        $masters = DB::table('t_porder_master as A')
            ->leftJoin('t_porder_detail as B', 'B.po_number', '=', 'A.po_number')
            ->leftJoin('m_products as C', 'C.product_code', '=', 'B.item_code')
            ->select([
                'A.id',
                'A.po_number',
                DB::raw('B.deposit_pv AS PVoucherNo_OLD'),
                DB::raw("(SELECT GROUP_CONCAT(DISTINCT pv.pvoucher_no) FROM t_payment_voucher_detail pv WHERE pv.ref_data = A.po_number) AS PVoucherNo"),
                'A.currency',
                'A.po_date',
                DB::raw('GROUP_CONCAT(B.item_code) AS item_codes'),
                DB::raw('GROUP_CONCAT(C.product_title) AS product_titles'),
                DB::raw('GROUP_CONCAT(C.product_title_cn) AS product_titles_cn'),
                'A.po_amount',
                'A.base_currency AS base_currency_total',
                'A.deposit',
                'A.base_deposit',
            ])
            ->whereIn('A.id', $ids)
            ->where('A.deposit', '>', 0)
            ->where('A.postatus_id', '!=', 3)
            ->groupBy('A.po_number')
            ->orderByDesc('A.id')
            ->get();

        $data = array();
        $TotalPOAmount = 0;
        $TotalPrepaidAmount = 0;
        $Currency = '';

        foreach($masters as $dtaitems){
            $ProductTitle = '';
            $data[] = array(
                'Date'=>$this->ConvertDateLanguage($dtaitems->po_date,$language),
                'PurchaseOrder'=>$dtaitems->po_number,
                'PaymentVoucher'=>($dtaitems->PVoucherNo == '' ? $this->ISGlobal('N.A.',$language) : $dtaitems->PVoucherNo),
                'Currency'=>$dtaitems->currency,
                'ProductTitle'=>$ProductTitle,
                'Empty'=>'',
                'Qty'=>'',
                'UnitPrice'=>number_format($dtaitems->po_amount,2),
                'Total'=>number_format($dtaitems->deposit,2),
                'Prepaid'=>number_format($dtaitems->base_deposit,2),
                'Details' => doDisplayDetails3($dtaitems->po_number,$language)
            );
            $Currency = $dtaitems->currency;
            $TotalPOAmount += $dtaitems->po_amount;
            $TotalPrepaidAmount += $dtaitems->deposit;
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('main', 'array', $data );
        $TBS->MergeBlock('a', $captionsArr);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function SupplierProfit($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/SupplierProfit.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $masters = POrder_detail::with(['product','poStatus'])
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
            ->orderByDesc('id')->get();

        $captionsArr = array();
        $captionsArr[] = array(
            'caption1'=>$this->ISGlobal("PO Number",$language),
            'caption2'=>$this->ISGlobal("Product Code",$language),
            'caption3'=>$this->ISGlobal("Product Name",$language),
            'caption4'=>$this->ISGlobal("Total Sales",$language),
            'caption5'=>$this->ISGlobal("Total Cost",$language),
            'caption6'=>$this->ISGlobal("Total Profit",$language),
            'caption7'=>$this->ISGlobal("Profit",$language) . ' %',
        );

        $FTotalSales = 0;
        $FTotalProfit = 0;
        $FTotalCost = 0;
        $data = array();
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        foreach($masters as $dtaitems){
            $ProductCode = $dtaitems->product->product_code ?? '';
            $Amounts = $this->TotalSalesTotalProfit($dtaitems->product_id);
            $Data = explode("|",$Amounts);
            $TotalSales = $Data[0];
            $TotalProfit = $Data[1];
            $TotalCost = $Data[2];
            if($TotalSales > 0){
                $Percentage = $this->getProfitPercentage($TotalProfit,$TotalCost);
                $ProductTitle = ($language == 'en' ? $dtaitems->product->product_title_en ?? '' : $dtaitems->product->product_title_cn ?? '');
                $data[] = array(
                    'PONumber'=>$dtaitems->po_number,
                    'ItemCode'=>$dtaitems->product->product_code ?? '',
                    'ProductTitle'=>$ProductTitle,
                    'Percentage'=>$Percentage,
                    'Currency'=>$baseCurrency,
                    'TotalSales'=>number_format($TotalSales,2),
                    'TotalProfit'=>number_format($TotalProfit,2),
                    'TotalCost'=>number_format($TotalCost,2),
                );
                $FTotalSales += $TotalSales;
                $FTotalProfit += $TotalProfit;
                $FTotalCost += $TotalCost;
            }
        }

        $Value0 = $FTotalSales;
        $Value1 = $FTotalProfit;
        $Value2 = $FTotalCost;
        $FTotalSales = number_format($FTotalSales,2);
        $FTotalProfit = number_format($FTotalProfit,2);
        $FTotalCost = number_format($FTotalCost,2);
        $FPercentage = $this->getProfitPercentage($Value1,$Value2);

        $TBS->VarRef['FTotalSales'] = $FTotalSales;
        $TBS->VarRef['FTotalCost'] = $FTotalCost;
        $TBS->VarRef['FTotalProfit'] = $FTotalProfit;
        $TBS->VarRef['FPercentage'] = $FPercentage;

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $captionsArr);
        $TBS->MergeBlock('b', $data );
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function getProfitPercentage($p_TotalProfit,$p_TotalPurchase){
        $TotalProfit = $p_TotalProfit;
        $TotalPurchase = $p_TotalPurchase;
        $returnPrcnt = intval(($p_TotalProfit / $p_TotalPurchase) * 100) . '%';
        return $returnPrcnt;
    }
    public function TotalSalesTotalProfit($product_id){
        $totals = Orders::where('product_id', $product_id)
            ->selectRaw('
                COALESCE(SUM(e_total_sales), 0) as ETotalSales,
                COALESCE(SUM(e_profit), 0) as EProfit,
                COALESCE(SUM(e_cost_total), 0) as ECostTotal
            ')
            ->first();

        return "{$totals->ETotalSales}|{$totals->EProfit}|{$totals->ECostTotal}";
    }
    public function SupplierRecItems($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $masters = Grn_details::with(['product'])
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
            ->orderByDesc('id')
            ->get();

        $captionsArr = array();
        $captionsArr[] = array(
            'Date'=>$this->ISGlobal("Date",$language),
            'GRNNo'=>$this->ISGlobal("GRN No.",$language),
            'Product'=>$this->ISGlobal("Product",$language),
            'ProductCode'=>$this->ISGlobal("Product Code",$language),
            'ProductName'=>$this->ISGlobal("Product Name",$language),
            'Total'=>$this->ISGlobal("Total",$language),
            'DefaultCurrency'=>$this->ISGlobal("Default Currency",$language),
            'InvoiceNo'=>$this->ISGlobal("Invoice No",$language),
            'PONo'=>$this->ISGlobal("PO No.",$language),
            'Qty'=>$this->ISGlobal("Qty",$language),
        );

        $data = array();
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        foreach($masters as $dtaitems){
            $ProductTitle = ($language == 'en' ? $dtaitems->product->product_title_en ?? '' : $dtaitems->product->product_title_cn ?? '');
            $data[] = array(
                'Date'=>$this->ConvertDateLanguage($dtaitems->grn_date,$language),
                'GRNNo'=>$dtaitems->grn_no,
                'InvoiceNo'=>$dtaitems->ap_invoice_no,
                'Currency'=>$dtaitems->currency,
                'BaseCurrency'=>$baseCurrency,
                'ItemCode'=>$dtaitems->product->product_title_code ?? '',
                'ProductTitle'=>$ProductTitle,
                'Total'=>number_format($dtaitems->total,2),
                'DefaultCurrency'=>number_format($dtaitems->base_total,2),
                'PONo'=>$dtaitems->po_number,
                'Qty'=>$dtaitems->received_qty,
            );
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $captionsArr);
        $TBS->MergeBlock('b', $data);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function SupplierItemOnPO($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/SupplierItemOnPO_v2.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $masters = POrder_master::when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
            ->orderByDesc('id')->get();

        $captionsArr = array();
        $captionsArr[] = array(
            'Date'=>$this->ISGlobal("Date",$language),
            'PONo'=>$this->ISGlobal("PO No.",$language),
            'Product'=>$this->ISGlobal("Product",$language),
            'ProductCode'=>$this->ISGlobal("Product Code",$language),
            'ProductName'=>$this->ISGlobal("Product Name",$language),
            'Total'=>$this->ISGlobal("Total",$language),
            'Deposit'=>$this->ISGlobal("Deposit",$language),
            'Price'=>$this->ISGlobal("Price",$language),
            'Qty'=>$this->ISGlobal("Qty",$language),
        );

        $data = array();
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        foreach($masters as $dtaitems){
            $data[] = array(
                'Empty'=>'',
                'Date'=>$this->ConvertDateLanguage($dtaitems->po_date,$language),
                'PONo'=>$dtaitems->po_number,
                'Currency'=>$dtaitems->currency,
                'BaseCurrency'=>$baseCurrency,
                'Details' => $this->SupplierItemOnPODetail($dtaitems->po_number,$language)
            );
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('main', 'array', $data );
        $TBS->MergeBlock('a', $captionsArr);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function SupplierItemOnPODetail($param, $lang){
        $details = POrder_detail::with('product')
            ->where('po_number', $param)
            ->get()
            ->map(function ($detail) use ($lang) {
                $productTitle = $detail->product 
                    ? ($lang === 'en' ? $detail->product->product_title_en : $detail->product->product_title_cn)
                    : null;

                return [
                    'ItemCode'    => $detail->product->product_code ?? '',
                    'ProductTitle'=> $productTitle,
                    'Qty'         => $detail->qty,
                    'Price'       => number_format($detail->price, 2),
                    'Total'       => number_format($detail->total, 2),
                    'Deposit'     => number_format($detail->deposit, 2),
                ];
            });

        return $details;
    }
    public function CustomerCreditNote($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $captionsArr = array();
        $captionsArr[] = array(
            'Customer'=>$this->ISGlobal("Customer",$language),
            'CustomerCode'=>$this->ISGlobal("Customer Code",$language),
            'CustomerName'=>$this->ISGlobal("Customer Name",$language),
            'CRNo'=>$this->ISGlobal("CR No",$language),
            'CRDate'=>$this->ISGlobal("CR Date",$language),
            'ExRate'=>$this->ISGlobal("Ex Rate",$language),
            'Amount'=>$this->ISGlobal("Amount",$language),
            'DefaultCurrency'=>$this->ISGlobal("Default Currency",$language),
        );

        $masters = Credit_note_customer::with(['customer'])
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))->orderByDesc('id')->get();

        $data = array();
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        foreach($masters as $dtaitems){
            $data[] = array(
                'CustomerCode'=>$dtaitems->customer->customer_code,
                'CustomerName'=>$dtaitems->customer->account_name_en,
                'CRNo'=>$dtaitems->cr_number,
                'CRDate'=>$this->ConvertDateLanguage($dtaitems->cr_date,$language),
                'Currency'=>$dtaitems->currency,
                'BaseCurrency'=>$baseCurrency,
                'ExRate'=>$dtaitems->ex_rate,
                'Amount'=>$dtaitems->currency.' '.number_format($dtaitems->amount,2),
                'DefaultCurrency'=>$baseCurrency.' '.number_format($dtaitems->base_amount,2)
            );
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $captionsArr);
        $TBS->MergeBlock('b', $data);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function CRCustomer_Report($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $captionsArr = array();
        $captionsArr[] = array(
            'caption1'=>$this->ISGlobal("Account Code",$language),
            'caption2'=>$this->ISGlobal("Description",$language),
            'caption3'=>$this->ISGlobal("Particulars",$language),
            'caption4'=>$this->ISGlobal("Currency",$language),
            'caption5'=>$this->ISGlobal("Ex Rate",$language),
            'caption6'=>$this->ISGlobal("Amount",$language),
            'caption7'=>$this->ISGlobal("Default Currency",$language),
        );

        $masters = Credit_note_customer::with(['customer','details'])
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))->orderByDesc('id')->get();

        $first = $masters->first();
    
        $AddressEN = $first->customer->billing_address_en ?? '';
        $AddressCN = $first->customer->billing_address_cn ?? '';
        $AddressEN = ($AddressEN == '' ? $AddressCN : $AddressEN);
        $AddressCN = ($AddressCN == '' ? $AddressEN : $AddressCN);
        $FAddress = ($language == 'en' ? $AddressEN : $AddressCN);

        $stringArr = $first->particulars;
        // Character to check
        $charToCheck = '~';
        if (strpos($stringArr, $charToCheck) !== false) {
            $String = explode("~", $stringArr);
            $Remarks = $String[0];
            $RemarksCN = ($language == 'en' ? $String[1] : $String[0] );
        } else {
            $Remarks = $stringArr;
            $RemarksCN = $stringArr;
        }
        $FRemarks = ($language == 'en' ? $Remarks : $RemarksCN);
        $masterdata = array();
        $masterdata[] = array(
            'C_CRNo' =>$this->ISGlobal('CR No',$language),
            'C_CRDate' =>$this->ISGlobal('CR Date',$language),
            'C_AccountNo' =>$this->ISGlobal('Customer Code',$language),
            'C_CustomerName' =>$this->ISGlobal('Customer Name',$language),
            'C_Remarks' =>$this->ISGlobal('Remarks',$language),
            'M_CRNo' => $first->cr_number,
            'M_CRDate' => $this->ConvertDateLanguage($first->cr_date,$language),
            'M_Customer_No' => $first->customer->customer_code ?? '',
            'M_CustomerName' => $first->customer->account_name_en ?? '',
            'M_TelNo' => $first->customer->tel_no ?? '',
            'M_Address' => $FAddress,
            'M_Remarks' => $FRemarks,
        );
        $caption = array();
        $caption[] = array(
            'caption1'=>$this->ConvertDateLanguage('Account Code',$language),
            'caption2'=>$this->ConvertDateLanguage('Description',$language),
            'caption3'=>$this->ConvertDateLanguage('Particulars',$language),
            'caption4'=>$this->ConvertDateLanguage('Currency',$language),
            'caption5'=>$this->ConvertDateLanguage('Ex Rate',$language),
            'caption6'=>$this->ConvertDateLanguage('Amount',$language),
            'caption7'=>$this->ConvertDateLanguage('Default Currency',$language),
        );

        $NRows = 0;
        $data = array();
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        foreach($masters as $list){
            $details = $list->details;
            foreach($details as $dtaitems){
                $NRows = $NRows + 1;
                $Description = ($language == 'en' ? $dtaitems->product->product_title_en ?? '' : $dtaitems->product->product_title_cn ?? '');
                if ($dtaitems->product->product_title_en ?? '' != null){
                    $dtaitems->particulars = $dtaitems->particulars.' '.$Description;
                }
                else{
                    $dtaitems->particulars = $dtaitems->particulars;
                }
                $data[] = array(
                    'AccountCode'=>$dtaitems->account_code,
                    'Description'=>$dtaitems->account->account_name_en ?? '',
                    'Particulars'=>$dtaitems->particulars,
                    'Currency'=>$dtaitems->currency,
                    'BaseCurrency'=>$baseCurrency,
                    'ExRate'=>$dtaitems->ex_rate,
                    'Amount'=>number_format($dtaitems->amount,2),
                    'DefaultCurrency'=>number_format($dtaitems->base_amount,2)
                );
            }
        }

        $expandRow = 0;

        if ($NRows < 13 ){
            $expandRow = 12 - $NRows;
        }
        else if ($NRows > 12 && $NRows < 26){
            $expandRow = (25 - $NRows) + 27;
        }
        else{
            $RowsonPage = $NRows - 25;
            if ($RowsonPage > 42){
                while ($RowsonPage > 42){
                    $RowsonPage = $RowsonPage - 42;
                }
            }
            if ($RowsonPage < 29){$RowsonPage = 28 - $RowsonPage;}
            else{$RowsonPage = (42 - $RowsonPage) + 26;}
            $expandRow = $RowsonPage; 
        }
        for ($j=0; $j<$expandRow; $j++){
            $expanderdata[] = array('expander'=>"");
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('m', $masterdata);
        $TBS->MergeBlock('a', $caption);
        $TBS->MergeBlock('b', $data);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function InternalTransfer($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $captionsArr = array();
        $captionsArr[] = array(
            'TransferNo'=>$this->ISGlobal("Transfer No",$language),
            'TransferDate'=>$this->ISGlobal("Transfer Date",$language),
            'Product'=>$this->ISGlobal("Product",$language),
            'RemQty'=>$this->ISGlobal("Rem Qty",$language),
            'WareHouseFrom'=>$this->ISGlobal("Ware House",$language).' '.$this->ISGlobal("From",$language),
            'WareHouseTo'=>$this->ISGlobal("Ware House",$language).' '.$this->ISGlobal("To",$language),
            'Qty'=>$this->ISGlobal("Age (Days)",$language),
        );

        $masters = Internal_Transfer::with(['product'])
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))->orderByDesc('id')->get();

        $data = array();
        $GrandTotalCostVal = 0;
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        foreach($masters as $dtaitems){
            $Description = ($language == 'en' ? $dtaitems->product->product_title_en ?? '' : $dtaitems->product->product_title_cn ?? '');
            $data[] = array(
                'TransferNo'=>$dtaitems->transfer_no.'-'.$dtaitems->transfer_ext,
                'TransferDate'=>$this->ConvertDateLanguage($dtaitems->transfer_date,$language),
                'ProductCode'=>$dtaitems->product->product_code ?? '',
                'ProductName'=>$Description,
                'RemQty'=>$dtaitems->rem_qty,
                'WareHouseFrom'=>$dtaitems->warehouse_from,
                'WareHouseTo'=>$dtaitems->warehouse_to,
                'Qty'=>$dtaitems->qty,
            );
        }
        $GrandTotalCost = array();
        $GrandTotalCost[] = array(
            'GrandTotalLabel' => $this->ISGlobal('Grand Total',$language),
            'GrandTotalCostValue'=> number_format($GrandTotalCostVal,2)
        );
        $GrandTotalLabel = $this->ISGlobal('Grand Total',$language);
        $GrandTotalCostValue = number_format($GrandTotalCostVal,2);

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $captionsArr);
        $TBS->MergeBlock('b', $data );
        $TBS->MergeBlock('c', $GrandTotalCost );
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function ReceiveGoods($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $captionsArr = array();
        $captionsArr[] = array(
            'SupplierName'=>$this->ISGlobal('Supplier Name',$language),
            'GRNDate'=>$this->ISGlobal('GRN Date',$language),
            'GRNNo'=>$this->ISGlobal('GRN No',$language),
            'Crtn'=>$this->ISGlobal('Crtns',$language),
            'Qty'=>$this->ISGlobal('Qty',$language),
            'Total'=>$this->ISGlobal('Total',$language),
            'WareHouse'=>$this->ISGlobal('Ware House',$language),
        );

        $captionsArr2 = array();
        $captionsArr2[] = array(
            'ProductCode' => $this->ISGlobal('Product Code',$language),
            'Product' => $this->ISGlobal('Product',$language),
            'ProductName' => $this->ISGlobal('Product Name',$language),
            'ItemWgt' => $this->ISGlobal('Item Wt',$language),
            'PcsCrtn' => $this->ISGlobal('Pcs/Ctn',$language),
            'LCM' => $this->ISGlobal('LCM',$language),
            'BCM' => $this->ISGlobal('BCM',$language),
            'HCM' => $this->ISGlobal('HCM',$language),
            'CBM' => $this->ISGlobal('CBM',$language),
            'VolWgt' => $this->ISGlobal('Vol Wt',$language),
            'Price' => $this->ISGlobal('PriceEach',$language),
            'Total' => $this->ISGlobal('Total',$language),
        );

        $masters = Grn_master::with(['supplier','grnDetails'])
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))->orderByDesc('id')->get();

        $mainBlock = array();
        $data = array();
        $details = array();
        $GrandTotalCostVal = 0;
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        foreach($masters as $dtaitems){
            $details = [];
            $suppliername_en = $dtaitems->supplier->suppliername_en ?? '';
            $suppliername_cn = $dtaitems->supplier->suppliername_cn ?? '';
            $SupplierName = ($language == 'en' ? $suppliername_en : ($suppliername_cn == '' || $suppliername_cn == null ? $suppliername_en : $suppliername_cn ));

            $total_cartons = 0;
            $total_qty = 0;
            $grnDetails = $dtaitems->grnDetails;
            foreach($grnDetails as $dtadtls){
                $ProductName = ($language == 'en' ? $dtadtls->product->product_title_en ?? '' : $$dtadtls->product->product_title_cn ?? '');
                $details[] = array(
                    'ProductCode'=>$dtadtls->product->product_code ?? '',
                    'ProductName'=>$ProductName,
                    'ItemWgt'=>$dtadtls->product->item_weight ?? 0,
                    'PcsCrtn'=>$dtadtls->product->pcs_per_carton ?? 0,
                    'LCM'=>$dtadtls->lcm,
                    'BCM'=>$dtadtls->bcm,
                    'HCM'=>$dtadtls->hcm,
                    'CBM'=>$dtadtls->cbm,
                    'VolWgt'=>$dtadtls->vweight,
                    'Price'=>$dtadtls->currency.' '.number_format($dtadtls->price,2),
                    'Total'=>$dtadtls->currency.' '.number_format($dtadtls->total,2)
                );
                $total_cartons += $dtadtls->cartons;
                $total_qty += $dtadtls->qty;
            }

            $mainBlock[] = array(
                'SupplierName'=>$SupplierName,
                'GRNDate'=>$this->ConvertDateLanguage($dtaitems->grn_date,$language),
                'GRNNo'=>$dtaitems->grn_no,
                'Ctn'=>$total_cartons,
                'Qty'=>$total_qty,
                'WareHouse'=>$dtaitems->warehouse,
                'C_SupplierName'=>$this->ISGlobal('Supplier Name',$language),
                'C_GRNDate'=>$this->ISGlobal('GRN Date',$language),
                'C_GRNNo'=>$this->ISGlobal('GRN No',$language),
                'C_Crtn'=>$this->ISGlobal('Ctn',$language),
                'C_Qty'=>$this->ISGlobal('Qty',$language),
                'C_Total'=>$this->ISGlobal('Total',$language),
                'C_WareHouse'=>$this->ISGlobal('Ware House',$language),

                'C_ProductCode' => $this->ISGlobal('Product Code',$language),
                'C_Product' => $this->ISGlobal('Product',$language),
                'C_ProductName' => $this->ISGlobal('Product Name',$language),
                'C_ItemWgt' => $this->ISGlobal('Item Wt',$language),
                'C_PcsCrtn' => $this->ISGlobal('Pcs/Ctn',$language),
                'C_LCM' => $this->ISGlobal('LCM',$language),
                'C_BCM' => $this->ISGlobal('BCM',$language),
                'C_HCM' => $this->ISGlobal('HCM',$language),
                'C_CBM' => $this->ISGlobal('CBM',$language),
                'C_VolWgt' => $this->ISGlobal('Vol Wt',$language),
                'C_Price' => $this->ISGlobal('PriceEach',$language),
                'C_Total' => $this->ISGlobal('Total',$language),
                'items' => $details
            );
        }
        $expanderdata[] = array('expander'=>"");
        $expanderdata[] = array('expander'=>"");
        $expanderdata[] = array('expander'=>"");
        $expanderdata[] = array('expander'=>"");

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $mainBlock);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function GRN_Report($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $caption = array();
        $caption[] = array(
            'caption1'=>$this->ISGlobal('Product Code',$language),
            'caption2'=>$this->ISGlobal('Product Name',$language),
            'caption3'=>$this->ISGlobal('Item Weight',$language),
            'caption4'=>$this->ISGlobal('CartonWeight',$language),
            'caption5'=>$this->ISGlobal('Cartons',$language),
            'caption6'=>$this->ISGlobal('Pcs Per Carton',$language),
            'caption7'=>$this->ISGlobal('LCM',$language),
            'caption8'=>$this->ISGlobal('BCM',$language),
            'caption9'=>$this->ISGlobal('HCM',$language),
            'caption10'=>$this->ISGlobal('CBM',$language),
            'caption11'=>$this->ISGlobal('Vol. Wgt',$language),
            'caption12'=>$this->ISGlobal('Qty',$language),
            'caption13'=>$this->ISGlobal('Price',$language),
            'caption14'=>$this->ISGlobal('Total',$language),
        );

        $masters = Grn_master::with(['supplier','storeLocation','grnDetails','whlist'])
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))->orderByDesc('id')->get();

        $data = array();
        $masterdata = array();
        $NRows = 0;
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        foreach($masters as $dta_master){
            if ($language == 'en'){
                $Address = $dta_master->supplier->supplier_address_en ?? "";
                $SupplierName = $dta_master->supplier->suppliername_en ?? "";
            }
            else{
                $Address = $dta_master->supplier->supplier_address_cn ?? "";
                $SupplierName = $dta_master->supplier->suppliername_en ?? "";
            }
            
            if ($dta_master->shipping_Stat_id == '0'){
                $ShippingStatus = '';
            }
            else{
                $shippingStatId = ($dta_master->shipping_Stat_id == '' || $dta_master->shipping_Stat_id == null) ? 0 : $dta_master->shipping_Stat_id;
                $shippingStatus = Shipping_stat::find($shippingStatId);
                if ($shippingStatus) {
                    $ShippingStatusText = ($language == 'en') ? $shippingStatus->shipping_stat_en : $shippingStatus->shipping_stat_cn;
                } else {
                    $ShippingStatusText = '';
                }
            }

            if ($dta_master->shipper_id == '0'){
                $Shipper = '';
            }
            else{
                $shipperId = (empty($dta_master->shipper_id)) ? 0 : $dta_master->shipper_id;
                $shipper = Courier::find($shipperId);
                if ($shipper) {
                    $shipperName = ($language == 'en') ? $shipper->courier_en : $shipper->courier_cn;
                } else {
                    $shipperName = '';
                }
            }

            $Currency = $dta_master->currency;
            $masterdata[] = array(
                'M_GRNNo'=>$dta_master->grn_no,
                'M_GRNDate'=>$this->ConvertDateLanguage($dta_master->grn_date,$language),
                'M_Currency'=>$dta_master->currency,
                'M_ExRate'=>$dta_master->ex_rate,
                'M_Supplier'=>$dta_master->supplier->supplier_code ?? '',
                'M_SupplierName'=>$SupplierName,
                'M_SupplierAddress'=>$Address,
                'M_WareHouse'=>$dta_master->warehouse,
                'M_ShippingStatus'=>$ShippingStatusText,
                'M_Shipper'=>$shipperName,
                'M_Company'=>$dta_master->storeLocation->store_name_en ?? '',
                'M_ReceivedBy'=>$dta_master->whlist->warehouse_en ?? '',
                'M_Cur1'=>$dta_master->currency,
                'M_Total'=>number_format($dta_master->total,2),
                'M_Cur2'=>$baseCurrency,
                'M_BaseTotal'=>number_format($dta_master->base_total,2),
                'C_GRNNo'=>$this->ISGlobal('GRN No',$language),
                'C_GRNDate'=>$this->ISGlobal('GRN Date',$language),
                'C_Currency'=>$this->ISGlobal('Currency',$language),
                'C_ExchangeRate'=>$this->ISGlobal('Exchange Rate',$language),
                'C_WareHouse'=>$this->ISGlobal('Ware House',$language),
                'C_ShippingStatus'=>$this->ISGlobal('Shipping Status',$language),
                'C_Shipper'=>$this->ISGlobal('Shipper',$language),
                'C_Company'=>$this->ISGlobal('Company',$language),
                'C_ReceivedBy'=>$this->ISGlobal('Received By',$language),
                'C_Total'=>$this->ISGlobal('Total',$language),
                'C_BaseTotal'=>$this->ISGlobal('Default Currency',$language),
                'C_CompanyAddress'=>$companyName
            );

            $grnDetails = $dta_master->grnDetails;

            foreach($grnDetails as $dtaitems){
				$NRows = $NRows + 1;   
				$Description = ($language == 'en' ? $dtaitems->product->product_title_en ?? '' : $dtaitems->product->product_title_cn ?? '');
				$data[] = array(
					'ItemCode'=>$dtaitems->product->product_code ?? '',
					'Description'=>$Description,
					'ItemWeight'=>$dtaitems->product->item_weight ?? 0,
					'CtnWeight'=>$dtaitems->cnt_weight,
					'Cartons'=>$dtaitems->cartons,
					'PcsPerCarton'=>$dtaitems->product->pcs_per_carton ?? 0,
					'LCM'=>$dtaitems->lcm,
					'BCM'=>$dtaitems->bcm,
					'HCM'=>$dtaitems->hcm,
					'CBM'=>$dtaitems->bcm,
					'VolWeight'=>$dtaitems->vweight,
					'Qty'=>$dtaitems->qty,
					'Price'=>number_format($dtaitems->price,2),
					'Total'=>number_format($dtaitems->total,2),
				);
            }
        }

        $expanderdata = array();
        $expandRow = 0;
        if ($NRows < 9 ){
            $expandRow = 8 - $NRows;
        }
        else if ($NRows > 8 && $NRows < 26){
            $expandRow = (25 - $NRows) + 27;  
        }
        for ($j=0; $j<$expandRow; $j++){
            $expanderdata[] = array('expander'=>"");
        }

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
		$TBS->MergeBlock('m', $masterdata);
		$TBS->MergeBlock('a', $caption);
		$TBS->MergeBlock('b', $data);
		$TBS->MergeBlock('d', $expanderdata);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function PrepareShipment($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $captionsArr = array();
        $captionsArr[] = array(
            'InvoiceNo'=>$this->ISGlobal('Invoice No',$language),
            'Customer'=>$this->ISGlobal('Customer',$language),
            'CustomerCode'=>$this->ISGlobal('Customer Code',$language),
            'CustomerName'=>$this->ISGlobal('Customer Name',$language),
            'ShippingStatus'=>$this->ISGlobal('Status',$language),
            'Product'=>$this->ISGlobal('Product',$language),
            'ItemCode'=>$this->ISGlobal('Product Code',$language),
            'ProductName'=>$this->ISGlobal('Product Name',$language),
            'TotalQty'=>$this->ISGlobal('Total Qty',$language),
            'RemQty'=>$this->ISGlobal('Rem Qty',$language),
            'ReadyToShip'=>$this->ISGlobal('Ready To Ship',$language),
            'Shipped'=>$this->ISGlobal('Shipped',$language),
        );

        $masters = Invoice_master::with(['invoiceDetails.product', 'shippingStat', 'customer'])
            ->whereHas('invoiceDetails', function ($query) {
                $query->whereNotNull('product_id')
                    ->whereRaw('qty - on_ship_out_qty > 0');
            })
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
            ->orderByDesc('id')
            ->get(); // 🛠️ This is important to actually fetch the data

        $data = [];
        $dataCSV = [];

        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');

        foreach ($masters as $master) {
            foreach ($master->invoiceDetails as $item) {
                // Add this relation to Invoice_detail if missing
                $shippingStatus = $item->shippingStat 
                    ? ($language == 'en' ? $item->shippingStat->shipping_stat_en : $item->shippingStat->shipping_stat_cn) 
                    : '';

                $description = $language == 'en' ? ($item->product->product_title_en ?? '') : ($item->product->product_title_cn ?? '');

                $totalQty = $item->qty ?? 0;
                $onShipOutQty = $item->on_ship_out_qty ?? 0;
                $remQty = $totalQty - $onShipOutQty;

                if ($remQty > 0) {
                    $data[] = [
                        'Invoice'       => $master->invoice_no,
                        'CustomerCode'  => $master->customer->customer_code ?? '',
                        'CustomerName'  => $master->customer->account_name_en ?? '',
                        'ShippingStatus'=> $shippingStatus,
                        'ItemCode'      => $item->product->product_code ?? '',
                        'ProductName'   => $description,
                        'TotalQty'      => $totalQty,
                        'RemQty'        => $remQty,
                        'ReadyToShip'   => $item->qty ?? 0,
                        'Shipped'       => $item->shipped_qty ?? 0,
                    ];

                    $dataCSV[] = [
                        $master->invoice_no,
                        $master->customer->customer_code ?? '',
                        $master->customer->account_name_en ?? '',
                        $shippingStatus,
                        $item->product->product_code ?? '',
                        $description,
                        $totalQty,
                        $remQty,
                        $item->qty ?? 0,
                        $item->shipped_qty ?? 0,
                    ];
                }
            }
        }

      
        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $captionsArr);
        $TBS->MergeBlock('b', $data );
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function ShipOutItems($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $captionsArr = array();
        $captionsArr[] = array(
            'CustomerCode'=>$this->ISGlobal('Customer Code',$language),
            'CustomerName'=>$this->ISGlobal('Customer Name',$language),
            'Courier'=>$this->ISGlobal('Courier',$language),
            'Tracking'=>$this->ISGlobal('Tracking',$language),
            'InvoiceNo'=>$this->ISGlobal('Invoice No',$language),
            'ShippedPckgs'=>$this->ISGlobal('Shipped Packages',$language),
            'Status'=>$this->ISGlobal('Status',$language),
            'Date'=>$this->ISGlobal('Date',$language),
            'ProductCode'=>$this->ISGlobal('Product Code',$language),
            'ProductName'=>$this->ISGlobal('Product Name',$language),
            'Qty'=>$this->ISGlobal('Qty',$language),
        );

        $masters = Shipout_items::with(['product','customer','shippingStatus','courier'])
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))->orderByDesc('id')->get();

        $data = array();
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        foreach($masters as $dtaitems){
            $CustomerName = ($language == 'en' ? $dtaitems->customer->account_name_en : ($dtaitems->customer->account_name_cn == '' || $dtaitems->customer->account_name_cn == null ? $dtaitems->customer->account_name_en : $dtaitems->customer->account_name_cn));
            $ProductName = ($language == 'en' ? $dtaitems->product->product_title_en ?? '' :  $dtaitems->product->product_title_cn ?? '');
            $Shipping_Stat = ($language == 'en' ? $dtaitems->shippingStatus->shipping_stat_en ?? '': $dtaitems->shippingStatus->shipping_stat_cn ?? '');
            $CourierName = ($language == 'en' ? $dtaitems->courier->courier_en ?? '' : ($dtaitems->courier->courier_cn ?? '' == '' || $dtaitems->courier->courier_cn ?? '' == null ? $dtaitems->courier->courier_en ?? '' : $dtaitems->courier->courier_cn ?? ''));
            $Date = Carbon::parse($dtaitems->date)->format('M d Y');
            $data[] = array(
                'CustomerCode'=>$dtaitems->customer->customer_code ?? '',
                'CustomerName'=>$CustomerName,
                'Courier'=>$CourierName,
                'Tracking'=>$dtaitems->tracking,
                'InvoiceNo'=>$dtaitems->invoice_no,
                'ShippedPckgs'=>$dtaitems->shipped_packages,
                'Status'=>$Shipping_Stat,
                'Date'=>$this->ConvertDateLanguage($Date,$language),
                'ProductCode'=>$dtaitems->product->product_code ?? '',
                'ProductName'=>$ProductName,
                'Qty'=>$dtaitems->qty
            );
        }
       
        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $captionsArr);
        $TBS->MergeBlock('b', $data );
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function PaymentVoucher($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $captionsArr = array();
        $captionsArr[] = array(
            'cap1'=>$this->ISGlobal('PV Date',$language),
            'cap2'=>$this->ISGlobal('Payment to',$language),
            'cap3'=>"",
            'cap4'=>$this->ISGlobal('PV No',$language),
            'cap5'=>$this->ISGlobal('Ex Rate',$language),
            'cap6'=>$this->ISGlobal('Payment Type',$language),
            'cap7'=>$this->ISGlobal('AmountPaid2',$language),
            'cap8'=>$this->ISGlobal('Status',$language),
        );

        $masters = Payment_voucher_master::with(['supplier','customer','paymentType','invoiceStatus'])
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))->orderByDesc('id')->get();

        $data = array();
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        foreach($masters as $dtaitems){
            $PayTo = '';
            if ($dtaitems->payment_type_id == 1 || $dtaitems->payment_type_id == 5){
                $PayTo = $dtaitems->supplier->supplier_code ?? '' . ' / ' . $dtaitems->supplier->suppliername_en ?? '';
            }
            if ($dtaitems->payment_type_id  == 2){
                $PayTo = $dtaitems->pay_to_en;
            }
            if ($dtaitems->payment_type_id  == 3){
                $PayTo = $dtaitems->customer->customer_code ?? '' . ' / ' . $dtaitems->customer->account_name_en ?? '';
            }
            if ($dtaitems->payment_type_id  == 4){
                $PayTo = $dtaitems->supplier->supplier_code . ' / ' . $dtaitems->supplier->suppliername_en;
            }
            $PaymentType = ($language == 'en' ? $dtaitems->paymentType->payment_type_en ?? '' : $dtaitems->paymentType->payment_type_cn ?? '');
            $data[] = array(
                'data1'=>$this->ConvertDateLanguage($dtaitems->pv_date,$language),
                'data2'=>$PayTo,
                'data3'=>"",
                'data4'=>"",
                'data5'=>$dtaitems->pv_number,
                'data6'=>number_format($dtaitems->ex_rate,4),
                'data7'=>$PaymentType,
                'data8'=>number_format($dtaitems->total_amount,2),
                'data9'=>"",
                'data10'=>$dtaitems->currency,
                'data11'=>$dtaitems->total_amount,
                'data12'=>0,
            );
        }


        $TotalRMB = 0;
        $TotalSGD = 0;
        $TotalUSD = 0;
        foreach($data as $list){
            if($list['data10'] == 'RMB'){
                $TotalRMB += $list['data11'];
            }
            if($list['data10'] == 'SG$'){
                $TotalSGD += $list['data11'];
            }
            if($list['data10'] == 'US$'){
                $TotalUSD += $list['data11'];
            }
        }

        if($TotalRMB > 0){
            $data[] = array(
                'data1'=>"",
                'data2'=>"",
                'data3'=>"",
                'data4'=>"",
                'data5'=>"",
                'data6'=>"",
                'data7'=>"",
                'data8'=>number_format($TotalRMB,2),
                'data9'=>"",
                'data10'=>'RMB',
                'data11'=>"",
                'data12'=>1,
            );
        }
        if($TotalSGD > 0){
            $data[] = array(
                'data1'=>"",
                'data2'=>"",
                'data3'=>"",
                'data4'=>"",
                'data5'=>"",
                'data6'=>"",
                'data7'=>"",
                'data8'=>number_format($TotalSGD,2),
                'data9'=>"",
                'data10'=>'SG$',
                'data11'=>"",
                'data12'=>1,
            );
        }
        if($TotalUSD > 0){
            $data[] = array(
                'data1'=>"",
                'data2'=>"",
                'data3'=>"",
                'data4'=>"",
                'data5'=>"",
                'data6'=>"",
                'data7'=>"",
                'data8'=>number_format($TotalUSD,2),
                'data9'=>"",
                'data10'=>'US$',
                'data11'=>"",
                'data12'=>1,
            );
        }
       
        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $captionsArr);
        $TBS->MergeBlock('b', $data );
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function DownloadSelectedSinglePV($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['companyAddress'] = $Address;
        $TBS->VarRef['T_PO'] = ($language == 'en' ? 'PURCHASE ORDER' : '订购单');
        $TBS->VarRef['TelNo'] = "+65910081684";

        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }
        
        $masters = Payment_voucher_master::with(['supplier','customer','paymentType','invoiceStatus','details','chartOfAccount'])
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))->orderByDesc('id')->get();


        // ✅ Determine if we need to create a zip (multiple records) or single download
        $isSingleDownload = count($masters) === 1;
        
        // ✅ Only create zip if multiple records
        if (!$isSingleDownload) {
            $zip = new \clsTbsZip();
            $zip->CreateNew();
        }

        $ReferenceNo = array();
        $masterdata = array();
        $bottomdata = array();
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        foreach($masters as $item){

            $PaymentType = $item->payment_type_id;
            $PVoucherNo = $item->pv_number;

            if($PaymentType === 1){
                $Particulars = ($language == 'en' ? $item->particular_en : $item->particular_cn);
                $PVcurrency = $item->currency;
                $masterdata[] = array(
                    'M_PVoucherNo'=>$item->pv_number,
                    'M_PVDate'=>$this->ConvertDateLanguage($item->pv_date,$language),
                    'M_SupplierCode'=>$item->supplier->supplier_code ?? '',
                    'M_ExRate'=>$item->ex_rate,
                    'M_IssuedBy'=>"",
                    'C_PVNo'=>$this->ISGlobal('PV No',$language),
                    'C_Date'=>$this->ISGlobal('Date',$language),
                    'C_Supplier'=>$this->ISGlobal('Supplier',$language),
                    'C_ExchangeRate'=>$this->ISGlobal('Exchange Rate',$language),
                    'C_IssuedBy'=>$this->ISGlobal('IssuedBy',$language),
                    'M_Particulars'=>$Particulars,
                    'C_Particulars'=>$this->ISGlobal('Particulars',$language),
                    'M_Contact_Person'=>$item->supplier->contact_person_en,
                    'M_Supplier'=>$item->supplier->suppliername_en ?? '',
                    'M_Supplier_Address'=>$item->supplier->supplier_address_en ?? '',
                    'M_Postal_Code'=>$item->supplier->postal_code ?? '',
                    'M_Country'=>$item->supplier->countryList->country_en ?? '',
                    'C_TelNo'=>$this->ISGlobal('Tel. No.',$language),
                    'M_Contact_Number'=>$item->supplier->contact_number ?? '',
                    'C_Fax'=>$this->ISGlobal('Fax No',$language),
                    'M_Fax'=>$item->supplier->fax ?? '',
                );
                $bottomdata[] = array(
                    'M_BankInfo'=>"",
                    'C_BankInfo'=>$this->ISGlobal('Bank Information',$language),
                    'M_Cheqno'=>"",
                    'C_Cheqno'=>$this->ISGlobal('Cheque No',$language),
                    'C_Total'=>$this->ISGlobal('Total',$language),
                    'M_TotalFAmount'=>number_format($item->base_total_amount,2),
                    'M_TotalFCurrency'=>$item->currency,
                    'M_TotalAmount'=>number_format($item->total_amount,2),
                    'M_TotalExRateDiff'=>0.00,
                    'C_CompanyAddress'=>$Address
                );
                $C_Cheqno = $this->ISGlobal('Cheque No',$language);
                $C_BankInfo = $this->ISGlobal('Bank Information',$language);
                $C_Total = $this->ISGlobal('Total',$language);

                $M_Cheqno ="";
                $M_BankInfo = $item->chartOfAccount->account_name_en ?? '';
                $M_TotalFAmount = number_format($item->base_total_amount,2);
                $M_TotalFCurrency = $item->currency;
                $M_TotalAmount = number_format($item->total_amount,2);
                $M_TotalCurrency = $baseCurrency;
                $M_TotalExRateDiff = 0.00;

                $TBS->VarRef['C_Cheqno'] = $C_Cheqno;
                $TBS->VarRef['M_Cheqno'] = $M_Cheqno;
                $TBS->VarRef['C_Total'] = $C_Total;
                $TBS->VarRef['M_TotalFAmount'] = $M_TotalFAmount;
                $TBS->VarRef['M_TotalAmount'] = $M_TotalAmount;
                $TBS->VarRef['M_TotalExRateDiff'] = $M_TotalExRateDiff;
                $TBS->VarRef['C_BankInfo'] = $C_BankInfo;
                $TBS->VarRef['M_BankInfo'] = $M_BankInfo;
                $TBS->VarRef['M_TotalFCurrency'] = $M_TotalFCurrency;
                $TBS->VarRef['M_TotalCurrency'] = $M_TotalCurrency;

            }
            if($PaymentType === 2){
                $PayTo = ($language == 'en' ? $item->pay_to_en : $item->pay_to_cn);
                $Address = "";
                $Particulars = ($language == 'en' ? $item->particular_en : $item->particular_cn);

                $PVcurrency = $item->currency;
                $masterdata[] = array(
                    'M_PVoucherNo'=>$item->pv_number,
                    'M_PVDate'=>$this->ConvertDateLanguage($item->pv_date,$language),
                    'M_ExRate'=>$item->ex_rate,
                    'M_IssuedBy'=>"",
                    'C_PVNo'=>$this->ISGlobal('PV No',$language),
                    'C_Date'=>$this->ISGlobal('Date',$language),
                    'C_ExchangeRate'=>$this->ISGlobal('Exchange Rate',$language),
                    'C_IssuedBy'=>$this->ISGlobal('IssuedBy',$language),
                    'M_Particulars'=>$Particulars,
                    'C_Particulars'=>$this->ISGlobal('Particulars',$language),
                    'C_PayTo'=>$this->ISGlobal('Pay To',$language),
                    'M_PayTo'=>$PayTo,
                    'C_Address'=>$this->ISGlobal('Address',$language),
                    'M_Address'=>$Address
                );
                $bottomdata[] = array(
                    'M_BankInfo'=>$item->chartOfAccount->account_name_en ?? '',
                    'C_BankInfo'=>$this->ISGlobal('Bank Information',$language),
                    'M_Cheqno'=>"",
                    'C_Cheqno'=>$this->ISGlobal('Cheque No',$language),
                    'C_Total'=>$this->ISGlobal('Total',$language),
                    'M_TotalFAmount'=>number_format($item->base_total_amount,2),
                    'M_TotalFCurrency'=>$item->currency,
                    'M_TotalAmount'=>number_format($item->total_Amount,2),
                    'M_TotalCurrency'=>$baseCurrency,
                    'C_CompanyAddress'=>$Address
                );
                $C_Cheqno = $this->ISGlobal('Cheque No',$language);
                $C_BankInfo = $this->ISGlobal('Bank Information',$language);
                $C_Total = $this->ISGlobal('Total',$language);

                $M_Cheqno = "";
                $M_BankInfo = $item->chartOfAccount->account_name_en ?? '';
                $M_TotalFAmount = number_format($item->base_total_amount,2);
                $M_TotalFCurrency = $item->currency;
                $M_TotalAmount = number_format($item->total_Amount,2);
                $M_TotalCurrency = $baseCurrency;

                $TBS->VarRef['C_Cheqno'] = $C_Cheqno;
                $TBS->VarRef['M_Cheqno'] = $M_Cheqno;
                $TBS->VarRef['C_Total'] = $C_Total;
                $TBS->VarRef['M_TotalFAmount'] = $M_TotalFAmount;
                $TBS->VarRef['M_TotalAmount'] = $M_TotalAmount;
                $TBS->VarRef['M_TotalExRateDiff'] = 0;
                $TBS->VarRef['C_BankInfo'] = $C_BankInfo;
                $TBS->VarRef['M_BankInfo'] = $M_BankInfo;
                $TBS->VarRef['M_TotalFCurrency'] = $M_TotalFCurrency;
                $TBS->VarRef['M_TotalCurrency'] = $M_TotalCurrency;
            }
            if ($PaymentType == 1){ 
                $caption = array();
                $caption[] = array(
                    'caption1'=>$this->ISGlobal('Account Code',$language),
                    'caption2'=>$this->ISGlobal('Description',$language),
                    'caption3'=>$this->ISGlobal('Particulars',$language),
                    'caption4'=>$this->ISGlobal('Exchange Rate',$language),
                    'caption5'=>$this->ISGlobal('Amount',$language),
                    'caption6'=>$this->ISGlobal('Default Currency',$language),
                    'caption7'=>$this->ISGlobal('ExRateDiff',$language),
                );
            }
            if ($PaymentType == 2){ 
                $caption = array();
                $caption[] = array(
                    'caption1'=>$this->ISGlobal('Account Code',$language),
                    'caption2'=>$this->ISGlobal('PaymentPreferrence',$language),
                    'caption3'=>$this->ISGlobal('Description',$language),
                    'caption4'=>$this->ISGlobal('Amount',$language),
                );
            }

            $data = array();
            $NRows = 0;

            foreach ($item->details as $detail) {
                if ($PaymentType == 1){
                    $NRows = $NRows + 1;
                    $Acc_Description = ($language == 'en' ? $detail->chartOfAccount->account_name_en ?? '' : $detail->chartOfAccount->account_name_cn ?? '');
                    $ItemCode = '';
                    $ItemDescription = '';
                    if ($detail->product_id == null || $detail->product_id == ''){
                        $ItemCode = '';
                        $ItemDescription = '';
                    }
                    else{
                        $ItemDescription = ($language == 'en' ? $detail->product->product_title_en ?? '' : $detail->product->product_title_cn ?? '');
                    }
                    $Description = ($language == 'en' ? $detail->chartOfAccount->account_name_en ?? '' : $detail->chartOfAccount->account_name_cn ?? '');
                    $ItemCodeDes = $ItemCode . ' ' . $ItemDescription;

                    $data[] = array(
                        'Acc_Code'=>$detail->account_code,
                        'ExRate'=>$detail->ex_rate,
                        'Acc_Description'=>$Acc_Description,
                        'Particulars'=>$ItemCodeDes,
                        'FAmount'=>number_format($detail->amount,2),
                        'Amount'=>number_format($detail->base_amount,2),
                        'ExRateDiff'=>number_format($detail->ex_rate_diff,2)
                    );
                }
                if ($PaymentType == 2){
                    $Acc_Description = ($language == 'en' ? $detail->chartOfAccount->account_name_en ?? '' : $detail->chartOfAccount->account_name_cn ?? '');
                    $NRows = $NRows + 1; 
                    $data[] = array(
                        'Acc_Code'=>$detail->account_code,
                        'Acc_Description'=>$Acc_Description,
                        'F_Amount'=>number_format($detail->amount,2),
                        'Currency'=>$detail->currency,
                        'Amount'=>number_format($detail->base_amount,2),
                        'BaseCurrency'=>$baseCurrency
                    );
                }
            }
            if($PaymentType === 1){
                $templatePath = base_path('templates/ReportTemplate/PVoucherSupplier_Report.odt');
            }
            if($PaymentType === 2){
                $templatePath = base_path('templates/ReportTemplate/PVoucher_Report.odt');
            }
            $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
            $TBS->MergeBlock('m', $masterdata);
            $TBS->MergeBlock('a', $caption);
            $TBS->MergeBlock('b', $data);
            $TBS->MergeBlock('c', $bottomdata);
            
            // ✅ Output file name
            $outputFileName = $PVoucherNo . '.' . $format;
            
            // ✅ Single download: immediately download and exit
            if ($isSingleDownload) {
                $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
                exit;
            }
            
            // ✅ Multiple downloads: save to string and add to zip
            $TBS->Show(OPENTBS_STRING);
            $zip->FileAdd($outputFileName, $TBS->Source, TBSZIP_STRING);
        }
        
        // ✅ For multiple files, flush the zip
        if (!$isSingleDownload) {
            $zip->Flush(TBSZIP_DOWNLOAD, 'SelectedPaymentVoucher.zip');
        }
    }
    public function ReceiveVoucher($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $masters = Receive_voucher_master::with(['invoiceStatus','customer','bank'])
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
            ->orderByDesc('id')->get();

        $captionsArr = array();
        $captionsArr[] = array(
            'cap1'=>$this->ISGlobal('RV Date',$language),
            'cap2'=>$this->ISGlobal('Customer',$language),
            'cap3'=>$this->ISGlobal('Transaction Details',$language),
            'cap4'=>$this->ISGlobal('RV No',$language),
            'cap5'=>$this->ISGlobal('Ex Rate',$language),
            'cap6'=>$this->ISGlobal('Bank',$language),
            'cap7'=>$this->ISGlobal('AmountPaid2',$language),
            'cap8'=>$this->ISGlobal('Status',$language),
            'cap9'=>$this->ISGlobal('Default Currency',$language),
        );

        $data = array();

        $TotalAllRMB = 0;
        $TotalRMB = 0;
        $TotalSGD = 0;
        $TotalUSD = 0;

        foreach($masters as $dtaitems){
            $InvoiceStatus = ($language == 'en' ? $dtaitems->invoiceStatus->status_value_en ?? '' : $dtaitems->invoiceStatus->status_value_cn ?? '');
            $invoice = Receive_voucher_master_invoices::with('invoiceMasters')->find($dtaitems->id);
            $Invoices = '';
            if ($invoice) {
                $Invoices = $invoice->invoiceMasters->pluck('invoice_no')->filter()->implode(', ');
            }

            $mystring = $Invoices;
            $word = ",";
            if(strpos($mystring, $word) !== false){
                $Invoices =  $this->ISGlobal('Multiple',$language);
            }
            else if($Invoices == ''){
                $Invoices = ($language == 'en' ? $dtaitems['Description'] : $dtaitems['DescriptionCN']);
                $Invoices = $Invoices;
            }
            else{
                $Invoices = $mystring;
            }
            $EN = $dtaitems->bank->account_name_en ?? '';
            $CN = $dtaitems->bank->account_name_cn ?? '';
            $BankName = ($language == 'en' ? $EN : $CN);
            $DefaultCurrency = $dtaitems->amount_paid * $dtaitems->ex_rate;
            
            $data[] = array(
                'data1'=>$this->ConvertDateLanguage($dtaitems->rv_date,$language),
                'data2'=>$dtaitems->customer->customer_code ?? '',
                'data3'=>$dtaitems->customer->account_name_en ?? '',
                'data4'=>$Invoices,
                'data5'=>$dtaitems->rv_number,
                'data6'=>$dtaitems->ex_rate,
                'data7'=>$BankName,
                'data8'=>number_format($dtaitems->amount_paid,2),
                'data9'=>$InvoiceStatus,
                'data10'=>$dtaitems->currency,
                'data11'=>number_format($DefaultCurrency,2),
                'data12'=>$dtaitems->amount_paid,
            );
            $TotalAllRMB += $DefaultCurrency;
        }

        $dataFooterArr = $this->getDateWiseScore($data);
        foreach($dataFooterArr as $list){
            $dataFooter[] = array(
                'text' => $this->ISGlobal('Total',$language),
                'currency' => $list['data10'],
                'amount' => number_format($list['data12'],2)
            );
        }
        $dataFooter[] = array(
            'text' => $this->ISGlobal('Total Default Currency',$language),
            'currency' => 'RMB',
            'amount' => number_format($TotalAllRMB,2)
        );

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('a', $captionsArr);
        $TBS->MergeBlock('b', $data );
        $TBS->MergeBlock('c', $dataFooter );
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function getDateWiseScore($data) {
        $groups = array();
        foreach ($data as $item) {
            $key = $item['data10'];
            if (!array_key_exists($key, $groups)) {
                $groups[$key] = array(
                    'data10' => $item['data10'],
                    'data12' => $item['data12'],
                );
            } else {
                $groups[$key]['data12'] = $groups[$key]['data12'] + $item['data12'];
            }
        }
        return $groups;
    }
    public function RVoucher_Report($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }

        $masters = Receive_voucher_master::with(['invoiceStatus','customer','bank','rvDetails'])
            ->when(!empty($ids), fn($q) => $q->whereIn('id', $ids))
            ->orderByDesc('id')->get();

        $caption = array();
        $caption[] = array(
            'caption1'=>$this->ISGlobal('Account Code',$language),
            'caption2'=>$this->ISGlobal('Description',$language),
            'caption3'=>$this->ISGlobal('Particulars',$language),
            'caption4'=>$this->ISGlobal('Exchange Rate',$language),
            'caption5'=>$this->ISGlobal('Amount',$language),
            'caption6'=>$this->ISGlobal('Default Currency',$language),
            'caption7'=>$this->ISGlobal('ExRateDiff',$language),
        );

        $data = array();
        $masterdata = array();
        $bottomdata = array();
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        $NRows = 0;
        foreach($masters as $dta_master){
            $Country1 = ($language == 'en' ? $dta_master->customer->countryList->country_en ?? '' : $dta_master->customer->countryList->country_cn ?? '');
            $RVcurrency = $dta_master->currency;
            $masterdata[] = array(
                'M_RVoucherNo'=>$dta_master->rv_number,
                'M_RVDate'=>$this->ConvertDateLanguage($dta_master->rv_date,$language),
                'M_Customer'=>$dta_master->customer->customer_code ?? '',
                'M_ExRate'=>$dta_master->ex_rate,
                'M_UpdatedBy'=> '',
                'C_RVoucherNo'=>$this->ISGlobal('RV No',$language),
                'C_Date'=>$this->ISGlobal('Date',$language),
                'C_AccountNo'=>$this->ISGlobal('Account No',$language),
                'C_ExchangeRate'=>$this->ISGlobal('Exchange Rate',$language),
                'C_UpdatedBy'=>$this->ISGlobal('Updated By',$language),
                'M_Contact_Name'=>$dta_master->customer->account_name_en ?? '',
                'M_Company'=>$dta_master->customer->company_en ?? '',
                'M_Business_Address'=>$dta_master->customer->billing_address_en ?? '',
                'M_Postal_Code'=>$dta_master->customer->billing_postal_code ?? '',
                'M_Country'=>$Country1,
                'C_TelNo'=>$this->ISGlobal('Tel. No.',$language),
                'M_Business_Phone'=>$dta_master->customer->billing_tel_no ?? '',
                'C_Fax'=>$this->ISGlobal('Fax No',$language),
                'M_Business_Fax'=>$dta_master->customer->billing_fax_no ?? '',
            );
            $BankInfo = $dta_master->bank->account_name_en ?? '';
            $C_Cheqno = $this->ISGlobal('Cheque No',$language);
            $C_BankInfo = $this->ISGlobal('Bank Information',$language);
            $C_Total = $this->ISGlobal('Total',$language);
    
            $M_Cheqno = "";
            $M_BankInfo = $BankInfo;

            $C_Currency = $RVcurrency;
            $M_TotalFAmount = number_format($dta_master->total,2);

            $C_BaseCurrency = $baseCurrency;
            $M_TotalAmount = number_format($dta_master->base_Total,2);

            $TBS->VarRef['C_Cheqno'] = $C_Cheqno;
            $TBS->VarRef['M_Cheqno'] = $M_Cheqno;
            $TBS->VarRef['C_Total'] = $C_Total;
            $TBS->VarRef['C_Currency'] = $C_Currency;
            $TBS->VarRef['M_TotalFAmount'] = $M_TotalFAmount;
            $TBS->VarRef['C_BaseCurrency'] = $C_BaseCurrency;
            $TBS->VarRef['M_TotalAmount'] = $M_TotalAmount;
            $TBS->VarRef['C_BankInfo'] = $C_BankInfo;
            $TBS->VarRef['M_BankInfo'] = $M_BankInfo;

            $bottomdata[] = array(
                'M_BankInfo'=>$BankInfo,
                'C_BankInfo'=>$this->ISGlobal('Bank Information',$language),
                'M_Cheqno'=>"",
                'C_Cheqno'=>$this->ISGlobal('Cheque No',$language),
                'C_Total'=>$this->ISGlobal('Total',$language),
                'C_Currency'=>$RVcurrency,
                'C_BaseCurrency'=>$baseCurrency,
                'M_TotalFAmount'=>number_format($dta_master->total,2),
                'M_TotalAmount'=>number_format($dta_master->base_Total,2),
                'M_TotalExDiff'=>0,
                'C_CompanyAddress'=>$this->ISGlobal('Address',$language),
            );

            foreach($dta_master->rvDetails as $dtaitems){
                $Particulars = '';
                $Acc_Description = ($language == 'en' ? $dtaitems->account->account_name_en ?? '' : $dtaitems->account->account_name_cn ?? '');
                if ($dtaitems->product_id > 0){
                    $product_code = $dtaitems->product->product_code ?? '';
                    $product_name = $language == 'en' ? $dtaitems->product->product_title_en ?? '' : $dtaitems->product->product_title_cn ?? '';
                    $Particulars = $product_code.' '. ($product_name);
                }
                else{
                    $Particulars = $dtaitems->particulars;
                }

                $data[] = array(
                    'Acc_Code'=>$dtaitems->account_code,
                    'Acc_Description'=>$Acc_Description,
                    'Particulars'=>$Particulars,
                    'ExRate'=>$dtaitems->ex_rate,
                    'F_Currency'=>$dtaitems->currency,
                    'BaseCurrency'=>$baseCurrency,
                    'FAmount'=>number_format($dtaitems->amount,2),
                    'Amount'=>number_format($dtaitems->base_amount,2),
                    'ExRateDiff'=>number_format($dtaitems->ex_rate_diff,2),
                );
                $NRows++;
            }
        }

		$expanderdata = array();
		$expandRow = 0;
		if ($NRows < 26 ){
			$expandRow = 25 - $NRows;
		}
		else if ($NRows > 25 && $NRows < 39){
			$expandRow = (38 - $NRows) + 27;  
		}
		else{
			$RowsonPage = $NRows - 25;
			if ($RowsonPage > 42){
				while ($RowsonPage > 42){
					$RowsonPage = $RowsonPage - 42;
				}
			}
				
			if ($RowsonPage < 29){
				$RowsonPage = 28 - $RowsonPage;
			}
			else{
				$RowsonPage = (42 - $RowsonPage) + 26;
			}
			$expandRow = $RowsonPage; 
		}
		for ($j=0; $j<$expandRow; $j++){
			$expanderdata[] = array('expander'=>"");
		}

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
        $TBS->MergeBlock('m', $masterdata);
        $TBS->MergeBlock('a', $caption);
        $TBS->MergeBlock('b', $data);
        $TBS->MergeBlock('c', $bottomdata);
        $TBS->MergeBlock('d', $expanderdata);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
    public function UnsoldOrderList($request){
        // ✅ Create a new instance of TinyButStrong
        $TBS = new \clsTinyButStrong();
        $TBS->Plugin(TBS_INSTALL, OPENTBS_PLUGIN);

        $format = $request->input('format', 'odt');
        $filename = $request->input('name');
        $language = $request->input('language');
        $ids = $request->input('ids', []); 

        $companyName = ISSettings::where('tag','companyName')->value('en');
        $storeLocation = Store_location::where('set_as_default',1)->first();
        $Address = ($language === 'en' ? $storeLocation->address_en : $storeLocation->address_cn);

        // ✅ Path to your .odt template
        $templatePath = base_path('templates/ReportTemplate/'.$filename.'.'.$format);

        if (!file_exists($templatePath)) {
            return response()->json(['error' => $templatePath . ' - Template not found'], 404);
        }

        $TBS->VarRef['companyName'] = $companyName;
        $TBS->VarRef['Address'] = $Address;
        if (is_string($ids)) {
            $ids = array_filter(explode(',', $ids));
        }
        $baseCurrency = ISSettings::where('tag', 'basecurrency')->value('en');
        $data = POrder_detail::with(['product', 'poMaster'])
            ->whereColumn('qty', '<>', 'receive_qty')
            ->get()
            ->map(function ($detail) use ($language,$baseCurrency) {

                if (!$detail->product) {
                    return null;
                }

                $order_qty = Orders::where('product_id', $detail['product_id'])
                    ->where('show_category', 'orders')
                    ->sum('qty');

                if ((int) $detail->qty - ((int) $order_qty + (int) $detail->allocated_qty) > 0) {
                    $unsold_qty = (int) $detail->qty - ((int) $order_qty + (int) $detail->allocated_qty);
                    
                    $product_thumbnail = Product_images::where('product_id',$detail->product->id)
                        ->where('type','thumbnail')->value('path');

                    $product_title_en = $detail->product->product_title_en ?? '';
                    $product_title_cn = $detail->product->product_title_cn ?? '';
                    $ProductName = ($language === 'en' ? $product_title_en : $product_title_cn);

                    return [
                        'BaseCurrency' => $baseCurrency,
                        'Currency' => $detail->poMaster->currency,
                        'ItemCode' => $detail->product->product_code ?? '',
                        'ProductName' => $ProductName,
                        'PODate' => $this->ConvertDateLanguage($detail->poMaster->po_date,$language),
                        'PONumber' => $detail->poMaster->po_number,
                        'POQty' => $detail->qty,
                        'OrderQty' => $order_qty,
                        'UnsoldQty' => $unsold_qty,
                        'Cost' => $detail->price,
                        'TotalCost' => number_format($unsold_qty * $detail->price, 2, '.', ''),
                        'BaseTotal' => number_format($unsold_qty * $detail->price * $detail->poMaster->ex_rate, 2, '.', ''),
                    ];
                }

                return null;
            })
            ->filter()
            ->sortBy([
                ['hold_qty', 'desc'],
                ['po_number', 'desc'],
            ])->values();

        $GrandBaseTotal = $data->sum('BaseTotal');

        $caption = array();
        $caption[] = array(
            'cap1'=>$this->ISGlobal('Product2',$language),
            'cap2'=>$this->ISGlobal('PODate2',$language),
            'cap3'=>$this->ISGlobal('PONo2',$language),
            'cap4'=>$this->ISGlobal('POQty2',$language),
            'cap5'=>$this->ISGlobal('POSoldQty2',$language),
            'cap6'=>$this->ISGlobal('UnsoldQty2',$language),
            'cap7'=>$this->ISGlobal('Cost2',$language),
            'cap8'=>$this->ISGlobal('TotalCost2',$language),
            'cap9'=>$this->ISGlobal('BaseTotal2',$language),
            'cap10'=>$this->ISGlobal('Product Code',$language),
            'cap11'=>$this->ISGlobal('Product Name',$language),
            'cap12'=>$this->ISGlobal('Total',$language),
        );

        $TBS->VarRef['BaseCurrency'] = $baseCurrency;
        $TBS->VarRef['GrandBaseTotal'] = number_format($GrandBaseTotal,2);

        $TBS->LoadTemplate($templatePath, OPENTBS_ALREADY_UTF8);
		$TBS->MergeBlock('a', $caption);
		$TBS->MergeBlock('b', $data);
        // ✅ Output file name
        $outputFileName = $filename . '.' . $format;
        // ✅ Download the generated file
        $TBS->Show(OPENTBS_DOWNLOAD, $outputFileName);
        exit; // Required to stop Laravel from continuing the response
    }
}
