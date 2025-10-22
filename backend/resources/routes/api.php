<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GlobalController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\PreorderController;
use App\Http\Controllers\PurchaseOrderController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// GLOBAL API
Route::post('/login', [App\Http\Controllers\CustomAuthController::class, 'login']);
Route::get('/access-rights/{loginId}', [App\Http\Controllers\GlobalController::class, 'getUserMenu']);
Route::get('/translations/{lang}', [App\Http\Controllers\CustomAuthController::class, 'getTranslations']);

// PRODUCT API

Route::middleware('throttle:api')->group(function () {

    Route::get('/producttypes-list', [GlobalController::class, 'getAllProductTypes']);
    Route::get('/manufacturer-list', [GlobalController::class, 'getAllManufacturers']);
    Route::get('/series-list', [GlobalController::class, 'getAllSeries']);
    Route::get('/brand-list', [GlobalController::class, 'getAllBrands']);
    Route::get('/genre-list', [GlobalController::class, 'getAllGenre']);
    Route::get('/bank-list', [GlobalController::class, 'getAllBanks']);
    Route::get('/product-all', [GlobalController::class, 'getAllProduct']);
    Route::get('/customer-all', [GlobalController::class, 'getAllCustomer']);
    Route::get('/supplier-list', [GlobalController::class, 'getAllSuppliers']);
    Route::get('/warehouse-list', [GlobalController::class, 'getAllWarehouse']);
    Route::get('/currency-list', [GlobalController::class, 'getAllCurrencies']);
    Route::get('/exchange-rate/{from}/{to}/{date}', [GlobalController::class, 'getExchangeRate']);
    Route::get('/current-exrate/{currency}/{baseCurrency}', [GlobalController::class, 'getCurrentDateExRate']);
    Route::get('/operator/{conversionKey}', [GlobalController::class, 'getOperator']);
    Route::get('/customergroup-list', [GlobalController::class, 'getAllCustomerGroup']);
    Route::get('/country-list', [GlobalController::class, 'getAllCountries']);
    Route::get('/state-list', [GlobalController::class, 'getAllStates']);
    Route::get('/source-list', [GlobalController::class, 'getAllSource']);
    Route::get('/courier-list', [GlobalController::class, 'getAllCourier']);
    Route::get('/sales-person-list', [GlobalController::class, 'getAllSalesPerson']);
    Route::get('/tax-group-list', [GlobalController::class, 'getAllTaxGroup']);
    Route::get('/shipping-terms-list', [GlobalController::class, 'getAllShippingTerms']);
    Route::get('/payment-terms-list', [GlobalController::class, 'getAllPaymentTerms']);
    Route::get('/customer-type-list', [GlobalController::class, 'getAllCustomerType']);
    Route::get('/customer-dropdowns/{tableName}/{id}', [GlobalController::class, 'getAllDropdownData']);
    Route::get('/all-dropdowns', [GlobalController::class, 'getAllDropdownDataList']);
    Route::get('/get-current-exrate', [GlobalController::class, 'getCurrentExRate']);
    Route::get('/get-postatus', [GlobalController::class, 'getAllPOStatus']);
    Route::get('/get-store-location', [GlobalController::class, 'getAllStoreLocation']);
    Route::get('/get-logs', [GlobalController::class, 'getLogs']);
    Route::get('/get-backups', [GlobalController::class, 'getBackups']);

    // PRODUCT API
    Route::get('/product-list', [ProductController::class, 'getAllProducts']);
    Route::get('/product-list-byCode', [ProductController::class, 'getAllProductsByCode']);
    Route::get('/product-archive', [ProductController::class, 'getArchiveProducts']);
    Route::get('/product-tagging', [ProductController::class, 'getProductTagList']);
    Route::get('/product-tagging-list/{id}', [ProductController::class, 'getTaggingDetails']);
    Route::put('/delete-product', [ProductController::class, 'delProduct']);
    Route::put('/delete-product-tag-master', [ProductController::class, 'delProductTagMaster']);
    Route::put('/delete-product-tag-detail', [ProductController::class, 'delProductTagDetail']);
    Route::put('/delete-dropdown', [ProductController::class, 'delDrodpdown']);
    Route::put('/delete-price/{id}', [ProductController::class, 'delPrice']);
    Route::get('/product-status/{productCode}', [ProductController::class, 'getProductStatus']);
    Route::get('/product-count/{productCode}', [ProductController::class, 'getProductExist']);
    Route::get('/product-count-tag/{productCode}', [ProductController::class, 'getProductExistTag']);
    Route::get('/product-info/{id}', [ProductController::class, 'getProductInfo']);
    Route::get('/product-wholesale-prices/{id}', [ProductController::class, 'getWholesalePricing']);
    Route::get('/product-prices-byid/{id}', [ProductController::class, 'getPrductPricingById']);
    Route::get('/product-prices-bygroupid/{id}', [ProductController::class, 'getPrductPricingGroupId']);
    Route::get('/product-retail-prices/{id}', [ProductController::class, 'getRetailPricing']);
    Route::get('/product-images/{id}', [ProductController::class, 'getProductImages']);
    Route::get('/product-images-tag/{id}', [ProductController::class, 'getProductImagesTag']);
    Route::get('/product-tag-popup', [ProductController::class, 'getPreorderProducts']);
    Route::get('/product-profit-order/{id}', [ProductController::class, 'getProfitabilityByOrders']);
    Route::get('/product-profit-invoice/{id}', [ProductController::class, 'getProfitabilityByInvoice']);
    Route::get('/get-manufacturer-id/{id}', [ProductController::class, 'getManufacturerIdBySeries']);
    Route::post('/insert-product-tag/{id}', [ProductController::class, 'insertProductTag']);
    Route::post('/insert-product-new-tag/{masterId}', [ProductController::class, 'insertProductTagNew']);
    Route::post('/update-product/{id}', [ProductController::class, 'updateProduct']);
    Route::post('/update-product-tag/{id}', [ProductController::class, 'updateProductTag']);
    Route::post('/update-dropdowns/{id}', [ProductController::class, 'updateDropdowns']);
    Route::post('/update-tnt-wholesale/{id}', [ProductController::class, 'updateTntWholesale']);
    Route::post('/upsert-pricing', [ProductController::class, 'upsertPricing']);
    Route::post('/update-product-image-rank', [ProductController::class, 'updateProductImageRank']);
    Route::get('/update-product-all-status', [ProductController::class, 'updateAllProductStatus']);

    // CUSTOMER API
    Route::get('/customer-info/{id}', [CustomerController::class, 'getCustomerInfo']);
    Route::get('/customer-list', [CustomerController::class, 'getAllCustomer']);
    Route::get('/customer-list-byCode', [CustomerController::class, 'getAllCustomerByCode']);
    Route::put('/delete-customer', [CustomerController::class, 'delCustomer']);
    Route::get('/customer-emails/{customeId}', [CustomerController::class, 'getCustomerEmails']);
    Route::get('/customer-groups/{customeId}', [CustomerController::class, 'getCustomerGroup']);
    Route::get('/customer-orders/{customeId}', [CustomerController::class, 'getCustomerOrder']);
    Route::get('/customer-invoices/{customeId}', [CustomerController::class, 'getCustomerInvoices']);
    Route::get('/customer-sales-order/{customeId}', [CustomerController::class, 'getCustomerSalesOrder']);
    Route::get('/customer-deposit/{customeId}', [CustomerController::class, 'getCustomerDeposit']);
    Route::get('/customer-profitability/{customeId}', [CustomerController::class, 'getCustomerProfitability']);
    Route::get('/customer-order-history/{customeId}', [CustomerController::class, 'getCustomerOrderHistory']);
    Route::get('/customer-credit/{customeId}', [CustomerController::class, 'getCustomerCredit']);
    Route::get('/customer-credit2/{customeId}', [CustomerController::class, 'getCustomerCredit_old']);
    Route::get('/customer-refund/{customeId}', [CustomerController::class, 'getCustomerRefund']);
    Route::post('/update-customer/{id}', [CustomerController::class, 'updateCustomer']);
    Route::get('/customer-count/{productCode}', [CustomerController::class, 'getCustomerExists']);
    
    Route::get('/customer-orders-details/{orderId}', [CustomerController::class, 'getOrderDetails']);
    Route::get('/customer-invoice-details/{invoiceNo}', [CustomerController::class, 'getInvoiceDetails']);
    Route::get('/customer-so-details/{SONumber}', [CustomerController::class, 'getSODetails']);
    Route::get('/customer-deposit-details/{refData}/{type}', [CustomerController::class, 'getDepositDetails']);
    Route::get('/customer-credit-details/{refNumber}/{type}', [CustomerController::class, 'getCreditDetails']);

    // SUPPLIER API
    Route::put('/delete-supplier', [SupplierController::class, 'delSupplier']);
    Route::get('/get-supplier-list', [SupplierController::class, 'getAllSupplier']);
    Route::get('/supplier-info/{id}', [SupplierController::class, 'getSupplierInfo']);
    Route::get('/supplier-count/{productCode}', [SupplierController::class, 'getSupplierExists']);
    Route::post('/update-supplier/{id}', [SupplierController::class, 'updateSupplier']);
    Route::get('/supplier-invoices/{supplierId}', [SupplierController::class, 'getSupplierInvoices']);
    Route::get('/supplier-invoices-details/{refData}', [SupplierController::class, 'getSupplierInvoicesDetails']);
    Route::get('/supplier-deposit/{supplierId}', [SupplierController::class, 'getSupplierPrepaid']);
    Route::get('/supplier-deposit-details/{refData}', [SupplierController::class, 'getSupplierPrepaidDetails']);
    Route::get('/supplier-profitability/{supplierId}', [SupplierController::class, 'getSupplierProfitability']);
    Route::get('/supplier-received-items/{supplierId}', [SupplierController::class, 'getSupplierReceiveItems']);
    Route::get('/supplier-items-on-po/{supplierId}', [SupplierController::class, 'getSupplierItemsOnPO']);
    Route::get('/supplier-items-on-po-details/{refData}', [SupplierController::class, 'getSupplierItemsOnPODetail']);
    Route::get('/supplier-trans-info/{supplierId}', [SupplierController::class, 'getSupplierTransInfo']);
    Route::get('/supplier-accounts-payable/{supplierId}', [SupplierController::class, 'getAccountsPayable']);
    Route::get('/supplier-accounts-payable-details/{refData}', [SupplierController::class, 'getAccountsPayableDetail']);
    Route::get('/supplier-credit/{supplierId}', [SupplierController::class, 'getSupplierCredit']);
    Route::get('/supplier-credit-details/{refNumber}/{type}', [SupplierController::class, 'getSupCreditDetails']);

    // PREOREDER API
    Route::get('/preorder-list', [PreorderController::class, 'getAllPreorder']);
    Route::get('/unsold-order', [PreorderController::class, 'getUnsoldOrder']);
    Route::get('/preorder-info/{id}', [PreorderController::class, 'getPreorderInfo']);
    Route::get('/retail-price-byProduct/{productId}/{currency}', [PreorderController::class, 'getRetailPriceByProduct']);
    Route::get('/wholesale-price-byProduct/{productId}/{customerGroupId}/{currency}/{qty}', [PreorderController::class, 'getWholesalePricingByProduct']);
    Route::post('/update-preorder/{id}', [PreorderController::class, 'updatePreorder']);
    Route::post('/update-voucher/{id}', [PreorderController::class, 'updateVoucher']);
    Route::get('/get-selected-orders', [PreorderController::class, 'getSelectedPreorder']);
    Route::get('/customer-current-credit/{customerId}/{currency}', [PreorderController::class, 'getCurrentCreditCustomer']);
    Route::get('/get-rv-details', [PreorderController::class, 'getOrdersRVDetails']);
    Route::post('/confirm-order', [PreorderController::class, 'confirmOrder']);
    Route::get('/get-payment-info/{ids}', [PreorderController::class, 'testCredit']);
    Route::put('/delete-voucher', [PreorderController::class, 'delVoucher']);
    Route::put('/delete-preorder', [PreorderController::class, 'delPreorder']);
    Route::put('/cancel-preorder', [PreorderController::class, 'cancelPreorder']);
    Route::put('/create-preorder-so', [PreorderController::class, 'createSalesOrder']);
    Route::post('/hold-on-hold/{id}', [PreorderController::class, 'holdOnHold']);
    Route::get('/sales-performance', [PreorderController::class, 'getPerformance']);
    Route::get('/performance-details/{idToUse}/{type}', [PreorderController::class, 'getPerformanceDetails']);
    Route::get('/order-voucher', [PreorderController::class, 'getAllOrderVoucher']);
    Route::get('/order-voucher-bycode', [PreorderController::class, 'getAllOrderVoucherByCode']);
    Route::get('/get-closing-status', [PreorderController::class, 'getClosingStatus']);

    // PURCHASE ORDER API
    Route::get('/purchase-order-list', [PurchaseOrderController::class, 'getAllPurchaseOrder']);
    Route::put('/void-po/{PONumber}', [PurchaseOrderController::class, 'doVoidPO']);
    Route::get('/get-supplier-credit/{id}', [PurchaseOrderController::class, 'doGetSupplierCRDetails']);
    Route::post('/create-pv-deposit', [PurchaseOrderController::class, 'createPVDeposit']);
    Route::get('/deposit-paid', [PurchaseOrderController::class, 'getDepositPaidData']);
    Route::get('/purchase-order-info/{id}', [PurchaseOrderController::class, 'getPurchaseOrderInfo']);
    Route::get('/get-po-products-info/{productCode}', [PurchaseOrderController::class, 'getPOProductInfo']);
    Route::get('/get-po-supplier-info/{supplierCode}', [PurchaseOrderController::class, 'getPOSupplierinfo']);
    Route::get('/po-product-list', [PurchaseOrderController::class, 'getPOProductsList']);
    Route::get('/count-grn/{poId}', [PurchaseOrderController::class, 'getCountGRN']);
    Route::put('/cancel-purchase-order', [PurchaseOrderController::class, 'cancelPurchaseOrder']);
    Route::post('/update-purchase-order/{id}', [PurchaseOrderController::class, 'updatePurchaseOrder']);
    Route::get('/get-deposit-pv/{ref_data}/{product_id}', [PurchaseOrderController::class, 'getDepositPV']);
});