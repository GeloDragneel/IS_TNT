<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class POrder_detail extends BaseModel
{
    use HasFactory;

    protected $table = 't_porder_detail';
    
    protected $fillable = [
        'po_number',
        'product_id',
        'supplier_id',
        'postatus_id',
        'qty',
        'price',
        'total',
        'base_price',
        'base_total',
        'deposit',
        'base_deposit',
        'currency',
        'ex_rate',
        'item_cost',
        'retail_price',
        'allocated_qty',
        'receive_qty',
        'receive_date',
        'deposit_rv',
        'deposit_pv',
        'invoice_pv',
        'is_allocated',
    ];

    public function product(){
        return $this->belongsTo(Products::class, 'product_id', 'id');
    }
    public function invoiceDetails(){
        return $this->hasMany(Invoice_detail::class, 'product_id', 'product_id'); // indirect; we'll handle this manually
    }
    public function poStatus(){
        return $this->belongsTo(POStatus::class, 'postatus_id', 'id');
    }
    public function poMaster(){
        return $this->belongsTo(POrder_master::class, 'po_number', 'po_number');
    }
    public function depositVoucher(){
        return $this->belongsTo(Payment_voucher_master::class, 'deposit_pv', 'pv_number');
    }
}
