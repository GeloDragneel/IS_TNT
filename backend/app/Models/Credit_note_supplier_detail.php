<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Credit_note_supplier_detail extends Model
{
    use HasFactory;


    protected $table = 't_credit_note_supplier_detail';

    protected $fillable = [
        'supplier_id',
        'cr_number',
        'cr_date',
        'account_code',
        'currency',
        'ex_rate',
        'amount',
        'base_amount',
        'product_id',
        'ex_rate_diff',
        'particulars',
        'ref_data',
    ];
    
    public function supplier(){
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }
    public function product(){
        return $this->belongsTo(Products::class, 'product_id', 'id');
    }
    public function chartOfAccount(){
        return $this->belongsTo(Charts_of_account::class, 'account_code', 'account_code');
    }

}
