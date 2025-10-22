<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment_voucher_detail extends Model
{
    use HasFactory;

    protected $table = 't_pv_detail';
    protected $fillable = [
        'pv_number',
        'pv_date',
        'account_code',
        'product_id',
        'payment_type_id',
        'po_detail_id',
        'ap_detail_id',
        'qty',
        'account_no',
        'ap_invoice_no',
        'ref_data',
        'currency',
        'ex_rate',
        'amount',
        'base_amount',
        'ex_rate_diff',
    ];
    public function product(){
        return $this->belongsTo(Products::class, 'product_id', 'id');
    }
    public function chartOfAccount(){
        return $this->belongsTo(Charts_of_account::class, 'account_code', 'account_code');
    }
    public function paymentType(){
        return $this->belongsTo(Payment_type::class, 'payment_type_id', 'id');
    }
}
