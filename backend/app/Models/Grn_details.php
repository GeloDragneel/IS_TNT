<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Grn_details extends BaseModel
{
    use HasFactory;
    
    protected $table = 't_grn_detail';
    protected $fillable = [
        'grn_no',
        'po_number',
        'grn_date',
        'product_id',
        'supplier_id',
        'po_id',
        'grn_status_id',
        'qty',
        'price',
        'total',
        'base_total',
        'currency',
        'ex_rate',
        'received_qty',
        'cartons',
        'lcm',
        'bcm',
        'vweight',
        'cbm',
        'nw',
        'cnt_weight',
        'hcm',
        'item_cost',
        'invoice_deposit',
        'allocation',
        'warehouse',
        'ap_invoice_no',
        'advance_payment',
        'base_advance_payment',
        'imported',
    ];
    public function supplier(){
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }
    public function product(){
        return $this->belongsTo(Products::class, 'product_id', 'id');
    }
    public function pOrderDetail(){
        return $this->belongsTo(POrder_detail::class, 'po_id');
    }
    public function whList(){
        return $this->belongsTo(Warehouse::class, 'warehouse', 'wh_code');
    }
}
