<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Pagination\Paginator;

use App\Models\Receive_voucher_master;
use App\Models\Receive_voucher_detail;
use App\Models\Credit_note_customer;
use App\Models\Payment_voucher_master;
use App\Models\Payment_voucher_detail;
use App\Models\Account_supplier_cn;
use App\Models\Grn_details;
use App\Models\Grn_master;
use App\Models\Inventory_allocation;
use App\Models\Account_customer_cn;
use App\Models\Accounts_receivable;
use App\Models\Sales_order_master;
use App\Models\Sales_order_detail;
use App\Models\Invoice_master;
use App\Models\Invoice_detail;
use App\Models\Accounts_payable_master;
use App\Models\Accounts_payable_details;
use App\Models\POrder_detail;

use App\Observers\ReceiveVoucherMasterObserver;
use App\Observers\ReceiveVoucherDetailObserver;
use App\Observers\CreditNoteCustomerObserver;
use App\Observers\PVMasterObserver;
use App\Observers\PVDetailObserver;
use App\Observers\AccountSupplierCnObserver;
use App\Observers\GrnDetailsObserver;
use App\Observers\GrnMasterObserver;
use App\Observers\AllocationObserver;
use App\Observers\AccountCustomerCnObserver;
use App\Observers\AccountReceivableObserver;
use App\Observers\SOMasterObserver;
use App\Observers\SODetailObserver;
use App\Observers\CustInvoiceMasterObserver;
use App\Observers\CustInvoiceDetailObserver;
use App\Observers\APMasterObserver;
use App\Observers\APDetailObserver;
use App\Observers\PODetailObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
    */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
    */
    public function boot(): void{
        Paginator::useBootstrap(); // For Bootstrap 4/5 styled pagination
        Receive_voucher_master::observe(ReceiveVoucherMasterObserver::class);
        Receive_voucher_detail::observe(ReceiveVoucherDetailObserver::class);
        Credit_note_customer::observe(CreditNoteCustomerObserver::class);
        Payment_voucher_master::observe(PVMasterObserver::class);
        Payment_voucher_detail::observe(PVDetailObserver::class);
        Account_supplier_cn::observe(AccountSupplierCnObserver::class);
        Grn_details::observe(GrnDetailsObserver::class);
        Grn_master::observe(GrnMasterObserver::class);
        Inventory_allocation::observe(AllocationObserver::class);
        Account_customer_cn::observe(AccountCustomerCnObserver::class);
        Accounts_receivable::observe(AccountReceivableObserver::class);
        Sales_order_master::observe(SOMasterObserver::class);
        Sales_order_detail::observe(SODetailObserver::class);
        Invoice_master::observe(CustInvoiceMasterObserver::class);
        Invoice_detail::observe(CustInvoiceDetailObserver::class);
        Accounts_payable_master::observe(APMasterObserver::class);
        Accounts_payable_details::observe(APDetailObserver::class);
        POrder_detail::observe(PODetailObserver::class);
    }
}
