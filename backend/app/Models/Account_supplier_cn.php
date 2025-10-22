<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Account_supplier_cn extends Model
{
    use HasFactory;

    protected $table = 't_account_supplier_cn';
    protected $fillable = [
        'supplier_id',
        'cr_detail_id',
        'pv_detail_id',
        'transaction_date',
        'account_code',
        'cr_number',
        'pv_number',
        'ap_invoice_no',
        'ref_data',
        'ex_rate',
        'currency',
        'amount',
        'base_amount',
        'debit',
        'credit',
        'particulars',
        'created_at',
        'updated_at',
    ];
    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }
    public function chartAccount()
    {
        return $this->belongsTo(Charts_of_account::class, 'account_code', 'account_code');
    }
}
