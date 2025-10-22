<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Account_supplier_invoice extends Model{

    use HasFactory;

    protected $table = 't_account_supplier_invoice';

    protected $fillable = [
        'account_code',
        'supplier_id',
        'ap_detail_id',
        'pv_detail_id',
        'transaction_date',
        'ap_invoice_no',
        'pv_number',
        'ex_rate',
        'currency',
        'sub_total',
        'base_sub_total',
        'tax_amount',
        'base_tax_amount',
        'deposit',
        'base_deposit',
        'amount',
        'base_amount',
        'debit',
        'credit',
        'created_at',
        'updated_at',
    ];

    public function supplier(){
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }
}
