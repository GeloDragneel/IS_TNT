<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Receive_voucher_detail extends Model
{
    use HasFactory;

    protected $table = 't_rv_detail';

    protected $fillable = [
        'rv_number',
        'rv_date',
        'customer_id',
        'product_id',
        'order_id',
        'invoice_id',
        'invoice_no',
        'account_code',
        'qty',
        'currency',
        'ex_rate',
        'amount',
        'base_amount',
        'amount_paid',
        'ex_rate_diff',
        'particulars',
        'remarks',
        'created_at',
        'updated_at',
    ];
    public function order(){
        return $this->belongsTo(Orders::class, 'order_id');
    }
    public function account(){
        return $this->belongsTo(Charts_of_account::class, 'account_code', 'account_code');
    }
    public function invoice(){
        return $this->belongsTo(Invoice_master::class, 'invoice_id');
    }
    public function product(){
        return $this->belongsTo(Products::class, 'product_id','id');
    }
}
