<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Sales_order_detail_copy extends BaseModel
{
    use HasFactory;

    protected $table = 't_so_detail_copy';

    protected $fillable = [
        'so_number',
        'so_date',
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
        'product_type',
        'alloc_type',
        'warehouse',
        'particular',
        'remarks',
        'created_at',
        'updated_at',
    ];

    public function productItem(){
        return $this->belongsTo(Products::class, 'product_id','id');  // Foreign key is product_id
    }
    public function services(){
        return $this->belongsTo(Product_services::class, 'service_id','id');
    }
    public function productService(){
        return $this->belongsTo(Product_services::class, 'service_id','id');  // Foreign key is service_id
    }
    public function invoiceStatus(){
        return $this->belongsTo(Invoice_status::class, 'invoice_status_id', 'id');
    }
}
