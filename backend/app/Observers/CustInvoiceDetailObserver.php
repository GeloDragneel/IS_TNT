<?php

namespace App\Observers;

use App\Models\Invoice_detail;
use App\Models\Inventory_allocation;
use App\Models\Customer_deposit;
use App\Models\Products;
use App\Models\Sales_order_master;
use App\Models\Sales_order_detail;
use App\Models\Orders;

class CustInvoiceDetailObserver
{
    /**
     * Handle the Invoice_detail "created" event.
    */
    public function created(Invoice_detail $invoice_detail): void{
        //
    }

    /**
     * Handle the Invoice_detail "updated" event.
    */
    public function updated(Invoice_detail $invoice_detail): void{
        $allocation = Inventory_allocation::where('id',$invoice_detail->allocation_id)->first();
        if($allocation){
            $allocation->qty = $invoice_detail->qty;
            $allocation->total = $invoice_detail->qty * $invoice_detail->price;
            $allocation->invoice_no = $invoice_detail->invoice_no;
            $allocation->allocated_qty = $invoice_detail->qty;
            $allocation->save();
        }

        $invDetail = Invoice_detail::where('order_id',$invoice_detail->order_id)->first();
        if($invDetail){
            $sum_deposit = $invDetail->sum('qty');

            $customer_deposit = Customer_deposit::where('order_id',$invoice_detail->order_id)->first();
            if($customer_deposit){
                $customer_deposit->invoice_no = $invoice_detail->invoice_no;
                $customer_deposit->used_deposit = $sum_deposit;
                $customer_deposit->save();
            }
        }

        if($invoice_detail->invoice_status_id === 1 && $invoice_detail->product_type === 0){
            $product = Products::where('id',$invoice_detail->product_id)->first();
            $product->last_sold_date = $invoice_detail->invoice_date;
            $product->save();
        }
    }

    /**
     * Handle the Invoice_detail "deleted" event.
    */
    public function deleted(Invoice_detail $invoice_detail): void{
        $sum_deposit = Invoice_detail::where('order_id',$invoice_detail->order_id)->sum('qty');
        $so_number = Sales_order_master::where('invoice_no',$invoice_detail->invoice_no)->value('so_number');

        $customer_deposit = Customer_deposit::where('order_id',$invoice_detail->order_id)->first();
        if($customer_deposit){
            $customer_deposit->invoice_no = '';
            $customer_deposit->used_deposit = $sum_deposit;
            $customer_deposit->save();
        }

        $so_detail = Sales_order_detail::where('so_number',$so_number)->where('product_id',$invoice_detail->product_id)->first();
        if($so_detail){
            $so_detail->delete();
        }

        $orders = Orders::where('id',$invoice_detail->order_id)->first();
        if($orders){
            $orders->show_category = 'orders';
            $orders->allocated_qty = 0;
            $orders->save();
        }
    }

    /**
     * Handle the Invoice_detail "restored" event.
    */
    public function restored(Invoice_detail $invoice_detail): void{

    }

    /**
     * Handle the Invoice_detail "force deleted" event.
    */
    public function forceDeleted(Invoice_detail $invoice_detail): void{
        //
    }
}
