<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GlobalController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\PreorderController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\ReceiveGoodsController;
use App\Http\Controllers\AllocationController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\SOController;
use App\Http\Controllers\CustomerInvoiceController;
use App\Http\Controllers\RVController;
use App\Http\Controllers\MassMailerController;
use App\Http\Controllers\CustomerGroupController;
use App\Http\Controllers\ShipoutItemController;
use App\Http\Controllers\SupplierInvoiceController;
use App\Http\Controllers\PaymentVoucherController;
use App\Http\Controllers\ChartsOfAccountController;
use App\Http\Controllers\CustomerCreditNoteController;
use App\Http\Controllers\SupplierCreditNoteController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\PrintingController;
use App\Http\Controllers\DashboardController;

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

// Protected routes - require authentication
Route::middleware('check.session')->group(function () {
    Route::get('/check-auth', [CustomAuthController::class, 'checkAuth']);
    Route::post('/logout', [CustomAuthController::class, 'logout']);
});

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
    Route::get('/grn-status', [GlobalController::class, 'getAllGRNStatus']);
    Route::get('/expenses-list', [GlobalController::class, 'getAllExpenses']);
    Route::post('/restore-database', [GlobalController::class, 'restoreDatabase']);
    Route::post('/backup-database', [GlobalController::class, 'backupDatabase']);
    Route::post('/download-database', [GlobalController::class, 'downloadBackup']);
    Route::put('/delete-database', [GlobalController::class, 'deleteDatabase']);
    Route::get('/get-invoice-type', [GlobalController::class, 'getAllInvoiceType']);
    Route::get('/get-shipping-stat', [GlobalController::class, 'getAllShippingStat']);
    Route::get('/invoice-status', [GlobalController::class, 'getInvoiceStatus']);
    Route::get('/payment-type-list', [GlobalController::class, 'getAllPaymentType']);
    Route::get('/get-serial-no', [GlobalController::class, 'getSerialNo']);
    Route::post('/ai-report-query', [GlobalController::class, 'aiReportQuery']);
    // Route::get('/ai-db-schema', [GlobalController::class, 'getSchemaDescription']);

    // PRODUCT API
    Route::get('/product-list', [ProductController::class, 'getAllProducts']);
    Route::get('/product-import-list', [ProductController::class, 'getAllProductsImports']);
    Route::get('/product-list-sort', [ProductController::class, 'getAllProductsBySort']);
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
    Route::get('/get-inventory-tracking/{productCode}/{warehouseCode}/{language}', [ProductController::class, 'getTracking']);
    Route::get('/get-internal-transfer/{type}', [ProductController::class, 'getInternalTransfer']);
    Route::get('/get-internal-inventory', [ProductController::class, 'getInternalInventory']);
    Route::get('/get-stock-inventory', [ProductController::class, 'getStockTakeInventory']);
    Route::get('/get-stock-take', [ProductController::class, 'getAllStockTake']);
    Route::put('/delete-transfer', [ProductController::class, 'delTransfer']);
    Route::put('/save-transfer', [ProductController::class, 'saveTransfer']);
    Route::put('/confirm-transfer', [ProductController::class, 'confirmTransfer']);
    Route::put('/save-stock-take', [ProductController::class, 'saveStockTake']);
    Route::put('/delete-stock-take', [ProductController::class, 'delStockTake']);
    Route::put('/publish-product-imports', [ProductController::class, 'publishProductImports']);
    Route::post('/download-library', [ProductController::class, 'downloadLibrary']);

    // CUSTOMER API
    Route::get('/customer-info/{id}', [CustomerController::class, 'getCustomerInfo']);
    Route::get('/customer-list', [CustomerController::class, 'getAllCustomer']);
    Route::get('/customer-list-emails', [CustomerController::class, 'getAllCustomerEmails']);
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

    // GRN API
    Route::get('/receive-goods-list', [ReceiveGoodsController::class, 'getAllReceiveGoods']);
    Route::put('/delete-receive-goods', [ReceiveGoodsController::class, 'delReceiveGoods']);
    Route::get('/grn-info/{id}', [ReceiveGoodsController::class, 'getGRNInfo']);
    Route::get('/get-grn-products-info/{productCode}', [ReceiveGoodsController::class, 'grnGRNProductInfo']);
    Route::get('/grn-product-list', [ReceiveGoodsController::class, 'getAllGRNProducts']);
    Route::post('/update-receive-goods/{id}', [ReceiveGoodsController::class, 'updateReceiveGoods']);
    Route::get('/grn-allocation-list/{grnNo}', [ReceiveGoodsController::class, 'getAllocationList']);
    Route::post('/get-orders', [ReceiveGoodsController::class, 'getOrders']);
    Route::post('/allocated-orders', [ReceiveGoodsController::class, 'allocatedOrders']);
    Route::post('/test-allocated-orders/{grn_no}/{baseCurrency}/{allocArr}', [ReceiveGoodsController::class, 'doMakeSOFromAllocation']);

    // ALLOCATION API
    Route::get('/allocation-list', [AllocationController::class, 'getAllocationList']);
    Route::put('/delete-allocation', [AllocationController::class, 'delAllocation']);
    Route::put('/update-allocation/{qty}/{id}', [AllocationController::class, 'updateAllocation']);

    // SERVICES API
    Route::get('/service-list', [ServiceController::class, 'getServiceList']);
    Route::put('/delete-services', [ServiceController::class, 'delServices']);
    Route::post('/update-services', [ServiceController::class, 'updateServices']);

    // INVENTORY API
    Route::get('/inventory-list', [InventoryController::class, 'getInventoryList']);
    Route::get('/withdraw-list', [InventoryController::class, 'getWithdrawList']);
    Route::post('/update-withdraw-inventory', [InventoryController::class, 'updateWithdrawInventory']);

    // SO API
    Route::get('/sales-order-list', [SOController::class, 'getAllSalesOrder']);
    Route::post('/confirm-sales-order', [SOController::class, 'confirmSalesOrder']);
    Route::post('/get-deposit-paid', [SOController::class, 'getDepositPaid']);
    Route::post('/get-amount-paid', [SOController::class, 'getDepositOnDelete']);
    Route::post('/void-sales-order', [SOController::class, 'voidSalesOrder']);
    Route::put('/cancel-sales-order', [SOController::class, 'cancelDepositPaid']);
    Route::get('/so-info/{id}', [SOController::class, 'getSOInfo']);
    Route::get('/get-product-byinventory', [SOController::class, 'getProductByInventory']);
    Route::get('/get-customer-bycode/{customerCode}/{action}', [SOController::class, 'getCustomerInfoByCode']);
    Route::get('/get-price-on-product/{customer_id}/{qty}/{product_id}', [SOController::class, 'doGetPrice']);
    Route::post('/update-sales-order/{id}', [SOController::class, 'updateSalesOrder']);
    Route::get('/get-product-bycode/{product_code}/{customer_id}', [SOController::class, 'getProductByCode']);
    Route::get('/check-change-deposit/{order_id}/{deposit}/{old_deposit}/{type}', [SOController::class, 'doCheckChangeDeposit']);
    Route::put('/convert-to-invoice', [SOController::class, 'convertToInvoice']);

    // INVOICES API
    Route::get('/customer-invoice-list', [CustomerInvoiceController::class, 'getAllInvoices']);
    Route::get('/customer-invoice-info/{id}', [CustomerInvoiceController::class, 'getInvoiceInfo']);
    Route::put('/create-invoice', [CustomerInvoiceController::class, 'createShipment']);
    Route::post('/create-receive-voucher', [CustomerInvoiceController::class, 'createReceiveVoucher']);
    Route::post('/create-journal-voucher', [CustomerInvoiceController::class, 'createJournalVoucher']);
    Route::post('/paid-in-advance', [CustomerInvoiceController::class, 'paidInAdvance']);
    Route::post('/get-credit-details', [CustomerInvoiceController::class, 'getCreditsDetail']);
    Route::put('/cancel-customer-invoice', [CustomerInvoiceController::class, 'cancelDepositPaid']);
    Route::post('/void-customer-invoice', [CustomerInvoiceController::class, 'voidCustomerInvoice']);
    Route::post('/update-customer-invoice/{id}', [CustomerInvoiceController::class, 'updateCustomerInvoice']);
    Route::post('/void-single-invoice', [CustomerInvoiceController::class, 'voidSingleInvoice']);
    Route::post('/get-deposit-paid-invoice', [CustomerInvoiceController::class, 'getDepositPaidInv']);

    // RV API
    Route::get('/receive-voucher-list', [RVController::class, 'getAllRVList']);
    Route::get('/receive-voucher-info/{id}', [RVController::class, 'getRVInfo']);
    Route::post('/void-receive-voucher', [RVController::class, 'voidReceiveVoucher']);
    Route::get('/rv-charts-of-account', [RVController::class, 'getAllRVChartsOfAccounts']);
    Route::post('/update-receive-voucher/{id}', [RVController::class, 'updateReceiveVoucher']);
    Route::get('/receive-voucher-exists/{customer_id}', [RVController::class, 'getRVExists']);
    Route::get('/get-button-value/{customer_id}', [RVController::class, 'doGetButtonValue']);

    // MASS MAILER API
    Route::get('/mass-mailer-list', [MassMailerController::class, 'getMassMailerList']);
    Route::get('/email-settings', [MassMailerController::class, 'getEmailSettings']);
    Route::get('/email-tags', [MassMailerController::class, 'getTagEmails']);
    Route::get('/email-templates', [MassMailerController::class, 'getTemplates']);
    Route::get('/get-customer-by-groups', [MassMailerController::class, 'getCustomerByGroups']);
    Route::get('/get-templates/{status}', [MassMailerController::class, 'getAllTemplates']);
    Route::get('/get-product-images/{search}', [MassMailerController::class, 'getProductImages']);
    Route::post('/save-email-template/{id}/{saveType}', [MassMailerController::class, 'saveMassMailerTemplate']);
    Route::get('/get-template-json/{templateId}', [MassMailerController::class, 'getMassMailerTemplate']);
    Route::post('/send-mass-mailer', [MassMailerController::class, 'sendMassMailer']);
    Route::post('/update-mass-settings', [MassMailerController::class, 'updateMassSettings']);
    Route::post('/update-mass-tags', [MassMailerController::class, 'updateMasstags']);
    Route::put('/delete-mass-settings', [MassMailerController::class, 'delMassSettings']);
    Route::put('/delete-mass-tags', [MassMailerController::class, 'delMassTags']);
    Route::put('/delete-mass-templates', [MassMailerController::class, 'deleteTemplates']);
    Route::get('/get-campaign-list', [MassMailerController::class, 'getAllEmailCampaigns']);
    Route::get('/get-mass-contacts', [MassMailerController::class, 'getAllContacts']);
    Route::put('/delete-mass-mailer', [MassMailerController::class, 'deleteMassMailer']);
    Route::get('/get-email-exists/{email}', [MassMailerController::class, 'checkEmailExists']);

    // MASS MAILER API
    Route::get('/customer-group-list', [CustomerGroupController::class, 'getCustomerGroupList']);
    Route::put('/delete-customer-group', [CustomerGroupController::class, 'deleteCustomerGroup']);
    Route::post('/update-customer-group', [CustomerGroupController::class, 'updateCustomerGroup']);

    // MASS MAILER API
    Route::get('/shipout-item-list', [ShipoutItemController::class, 'getShipoutItemList']);
    Route::get('/prepared-shipment-list', [ShipoutItemController::class, 'getPreparedShipment']);
    Route::post('/delete-shipout-items', [ShipoutItemController::class, 'deleteShipOut']);
    Route::post('/update-shipout-items', [ShipoutItemController::class, 'updateShipoutItems']);
    Route::post('/sendmail-shipout-items', [ShipoutItemController::class, 'sendEmailOnShipOut']);
    Route::post('/confirm-shipment', [ShipoutItemController::class, 'confirmShipment']);

    // SUPPLIER INVOICE API
    Route::get('/supplier-invoice-list', [SupplierInvoiceController::class, 'getAllSupplierInvoice']);
    Route::post('/create-pv-invoice', [SupplierInvoiceController::class, 'createPVInvoice']);
    Route::put('/void-supplier-invoice/{apInvoiceNo}', [SupplierInvoiceController::class, 'doVoidSupplierInvoice']);
    Route::get('/supplier-invoice-info/{id}', [SupplierInvoiceController::class, 'getSupplierInvoiceInfo']);
    Route::post('/update-supplier-invoice/{id}', [SupplierInvoiceController::class, 'updateSupplierInvoice']);
    Route::get('/get-suppInvoice-products-info/{productCode}/{supplierId}', [SupplierInvoiceController::class, 'getSuppInvoiceProductInfo']);
    Route::get('/product-list-suppInvoice/{supplierId}', [SupplierInvoiceController::class, 'getAllProductsBySuppInv']);
    Route::get('/supplier-invoice-products/{supplierId}', [SupplierInvoiceController::class, 'getProductsBySupplierId']);
    Route::get('/paid-item-not-received', [SupplierInvoiceController::class, 'getPaidItemNotReceived']);
    Route::get('/preorder-list-byProducts', [SupplierInvoiceController::class, 'getAllPreorderByProduct']);
    Route::get('/unpaid-item-received', [SupplierInvoiceController::class, 'getUnpaidItemReceived']);

    // PAYMENT VOUCHER API
    Route::get('/payment-voucher-list', [PaymentVoucherController::class, 'getAllPaymentVoucher']);
    Route::get('/operating-expense-list', [PaymentVoucherController::class, 'getAllOperatingExpenses']);
    Route::post('/void-payment-voucher', [PaymentVoucherController::class, 'voidPaymentVoucher']);
    Route::get('/payment-voucher-info/{id}', [PaymentVoucherController::class, 'getPVInfo']);
    Route::get('/supplier-invoice-in-pv/{supplier_id}', [PaymentVoucherController::class, 'doGetSupplierInvoice']);
    Route::get('/supplier-invoice-details/{ap_number}/{account_code}', [PaymentVoucherController::class, 'doGetAPInvoiceDetail']);
    Route::post('/update-payment-voucher/{id}', [PaymentVoucherController::class, 'updatePaymentVoucher']);
    Route::get('/expense-charts-of-accounts', [PaymentVoucherController::class, 'getAllChartsExpenses']);

    // CHARTS OF ACCOUNT API
    Route::get('/charts-of-account-list', [ChartsOfAccountController::class, 'getChartsOfAccountList']);
    Route::post('/update-charts-of-account', [ChartsOfAccountController::class, 'updateChartsOfAccount']);
    Route::put('/delete-charts-of-account', [ChartsOfAccountController::class, 'delChartsOfAccount']);

    // CUSTOMER CREDIT NOTE API
    Route::get('/customer-credit-note-list', [CustomerCreditNoteController::class, 'getAllCustomerCreditNote']);
    Route::post('/void-customer-credit-note', [CustomerCreditNoteController::class, 'voidCustomerCreditNote']);
    Route::get('/customer-credit-info/{id}', [CustomerCreditNoteController::class, 'getCRInfo']);
    Route::post('/update-cust-credit-note/{id}', [CustomerCreditNoteController::class, 'updateCustCreditNote']);

    // SUPPLIER CREDIT NOTE API
    Route::get('/supplier-credit-note-list', [SupplierCreditNoteController::class, 'getAllSupplierCreditNote']);
    Route::post('/void-supplier-credit-note', [SupplierCreditNoteController::class, 'voidSupplierCreditNote']);
    Route::get('/supplier-credit-info/{id}', [SupplierCreditNoteController::class, 'getSuppCRInfo']);
    Route::post('/update-supp-credit-note/{id}', [SupplierCreditNoteController::class, 'updateSuppCreditNote']);

    // SETTINGS NOTE API
    Route::get('/get-languages', [SettingController::class, 'getLanguages']);
    Route::get('/get-couriers', [SettingController::class, 'getCouriers']);
    Route::get('/get-shipping-status', [SettingController::class, 'getShippingStatus']);
    Route::get('/get-tax-group', [SettingController::class, 'getTaxGroup']);
    Route::get('/get-payment-terms', [SettingController::class, 'getPaymentTerms']);
    Route::get('/get-warehouse-list', [SettingController::class, 'getWarehouseList']);
    Route::get('/get-shipping-terms', [SettingController::class, 'getShippingTerms']);
    Route::get('/get-source-list', [SettingController::class, 'getSourceList']);
    Route::get('/get-store-location-list', [SettingController::class, 'getStoreLocationList']);
    Route::get('/get-currency-list', [SettingController::class, 'getCurrenyList']);
    Route::get('/get-issetings-list', [SettingController::class, 'getISSettings']);
    Route::get('/get-emp-department', [SettingController::class, 'getEmpDepartment']);
    Route::get('/get-login-list', [SettingController::class, 'getLoginList']);
    Route::get('/get-employee-list', [SettingController::class, 'getAllEmployeeList']);
    Route::get('/get-menu-data', [SettingController::class, 'getAllMenuData']);
    Route::put('/delete-settings/{module}', [SettingController::class, 'delSettings']);
    Route::post('/update-settings/{module}', [SettingController::class, 'updateSettings']);
    Route::post('/update-access-rights', [SettingController::class, 'updateAccessRights']);
    Route::post('/set-as-default-settings/{tableId}/{module}', [SettingController::class, 'setAsDefaultSettings']);

    // REPORTS API
    Route::get('/get-transaction-list', [ReportsController::class, 'getAllTransactionList']);
    Route::get('/get-journal-entries-list', [ReportsController::class, 'getJournalEntriesList']);
    Route::get('/get-customer-deposit-list', [ReportsController::class, 'getCustomerDeposit']);
    Route::get('/get-sales-revenue-list', [ReportsController::class, 'getProfitSalesRevenue']);
    Route::get('/get-other-income-list', [ReportsController::class, 'getOthereIcome']);
    Route::get('/get-customer-deposit-details/{customerId}', [ReportsController::class, 'doDepositDetails']);
    Route::get('/get-profit-and-loss/{date_from}/{date_to}/{currency}', [ReportsController::class, 'getProfitAndLoss']);
    Route::get('/get-trial-balance/{date_from}/{date_to}', [ReportsController::class, 'getTrialBalance']);

    Route::post('/export-report', [PrintingController::class, 'exportReport']);

    // DASHBOARD API
    Route::get('/dashboard-exrates', [DashboardController::class, 'getDashboardExRates']);
    Route::get('/dashboard-shipments', [DashboardController::class, 'getDashboardShipments']);
    Route::get('/dashboard-preorder-closing', [DashboardController::class, 'getDashboardPreorderClosing']);
    Route::get('/dashboard-new-orders', [DashboardController::class, 'getDashboardNewOrders']);
    Route::get('/dashboard-items-and-inventory/{m}/{y}', [DashboardController::class, 'getDashboardItemsAndInventory']);
    Route::get('/dashboard-logistics/{m}/{y}', [DashboardController::class, 'getDashboardLogistics']);
    Route::get('/dashboard-allocation/{m}/{y}', [DashboardController::class, 'getDashboardAllocation']);
    Route::get('/dashboard-shipout/{m}/{y}', [DashboardController::class, 'getDashboardShipout']);
    Route::get('/dashboard-customer/{m}/{y}', [DashboardController::class, 'getDashboardCustomer']);
    Route::get('/dashboard-sales/{m}/{y}', [DashboardController::class, 'getDashboardSales']);
    Route::get('/dashboard-po/{m}/{y}', [DashboardController::class, 'getDashboardPO']);
    Route::get('/dashboard-supplier/{m}/{y}', [DashboardController::class, 'getDashboardSupplier']);
    Route::get('/dashboard-accounts/{m}/{y}', [DashboardController::class, 'getDashboardAccounts']);
});