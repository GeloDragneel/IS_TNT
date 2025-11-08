<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Inventory_allocation extends BaseModel
{
    use HasFactory;

    protected $table = 't_inventory_allocation';
    protected $fillable = [
        'grn_detail_id',
        'customer_id',
        'product_id',
        'service_id',
        'qty',
        'allocated_qty',
        'price',
        'total',
        'deposit',
        'voucher_amount',
        'base_voucher_amount',
        'currency',
        'invoice_no',
        'grn_no',
        'so_number',
        'pod',
        'warehouse',
        'account_no',
        'po_detail_id',
        'shipping_stat_id',
        'sales_person_id',
        'order_id',
    ];
    public function salesOrder(){
        return $this->belongsTo(Sales_order_master::class, 'so_number', 'so_number');
    }
    public function invoiceDetail(){
        return $this->belongsTo(Invoice_detail::class, 'id', 'allocated_id');
    }
    public function soDetail(){
        return $this->belongsTo(Sales_order_detail::class, 'id', 'allocated_id');
    }
    public function product(){
        return $this->belongsTo(Products::class, 'product_id', 'id');
    }
    public function customer(){
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }
    public function shippingStat(){
        return $this->belongsTo(Shipping_stat::class, 'shipping_stat_id', 'id');
    }
    public function chartOfAccount(){
        return $this->belongsTo(Charts_of_account::class, 'account_no', 'account_code');
    }
}
