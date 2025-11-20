<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Invoice_detail extends BaseModel{
    use HasFactory;
    
    protected $table = 't_invoice_detail';

    protected $fillable = [
        'invoice_no',
        'invoice_date',
        'customer_id',
        'product_id',
        'service_id',
        'invoice_status_id',
        'currency',
        'qty',
        'price',
        'total',
        'base_total',
        'deposit',
        'item_cost',
        'ex_rate',
        'order_id',
        'allocated_id',
        'grn_detail_id',
        'sales_person_id',
        'shipping_stat_id',
        'shipped_qty',
        'on_ship_out_qty',
        'product_type',
        'alloc_type',
        'warehouse',
        'particular',
        'remarks',
    ];
    public function customer(){
        return $this->hasOne(Customer::class, 'id', 'customer_id');
    }
    public function product(){
        return $this->belongsTo(Products::class, 'product_id');
    }
    public function productService(){
        return $this->belongsTo(Product_services::class, 'service_id','id');
    }
    public function invoiceStatus(){
        return $this->belongsTo(Invoice_status::class, 'invoice_status_id', 'id');
    }
}
