<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Credit_note_customer_detail extends BaseModel
{
    use HasFactory;

    protected $table = 't_credit_note_customer_detail';
    protected $fillable = [
        'cr_number',
        'cr_date',
        'customer_id',
        'supplier_id',
        'order_id',
        'product_id',
        'currency',
        'ex_rate',
        'amount',
        'base_amount',
        'ex_rate_diff',
        'particulars',
        'account_code',
        'remarks',
        'created_at',
        'updated_at',
    ];

    public function account(){
        return $this->belongsTo(Charts_of_account::class, 'account_code', 'account_code');
    }
    public function product(){
        return $this->belongsTo(Products::class, 'product_id', 'id');
    }
}
