<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shipout_items extends Model{

    use HasFactory;

    protected $table = 't_shipout_items';

    protected $fillable = [
        'shipping_no',
        'customer_id',
        'product_id',
        'courier_id',
        'tracking',
        'invoice_no',
        'shipped_packages',
        'status',
        'date',
        'qty',
        'invoice_detail_id',
        'is_email_sent',
        'on_update_shipout_items',
        'is_from_prepare',
        'remarks',
    ];

    public function customer(){
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }
    public function shippingStatus(){
        return $this->belongsTo(Shipping_stat::class, 'status', 'id');
    }
    public function courier(){
        return $this->belongsTo(Courier::class, 'courier_id', 'id');
    }
    public function product(){
        return $this->belongsTo(Products::class, 'product_id', 'id');
    }
}
