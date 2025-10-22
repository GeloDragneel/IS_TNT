<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Accounts_payable_details extends Model
{
    use HasFactory;

    protected $table = 't_ap_detail';
    protected $fillable = [
        'ap_number',
        'po_number',
        'ap_date',
        'supplier_id',
        'product_id',
        'service_id',
        'currency',
        'ex_rate',
        'qty',
        'receive_qty',
        'price',
        'total',
        'deposit',
        'base_deposit',
        'po_ex_rate',
        'grn_ex_rate',
        'po_adv_pay',
        'grn_base_total',
        'po_detail_id',
        'lock_del',
        'product_type',
    ];
    public function product(){
        return $this->belongsTo(Products::class, 'product_id', 'id');
    }
    public function service(){
        return $this->belongsTo(Product_services::class, 'service_id', 'id');
    }
    public function apMaster(){
        return $this->belongsTo(Accounts_payable_master::class, 'ap_number', 'ap_number');
    }
    public function grnDetail(){
        return $this->hasOne(Grn_details::class, 'po_number', 'po_number')->whereColumn('product_id', 'product_id');
    }
}
