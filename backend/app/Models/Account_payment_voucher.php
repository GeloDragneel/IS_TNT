<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Account_payment_voucher extends BaseModel
{
    use HasFactory;

    protected $table = 't_account_payment_voucher';
    protected $fillable = [
        'account_code',
        'transaction_date',
        'pv_number',
        'currency',
        'ex_rate',
        'amount',
        'base_amount',
        'debit',
        'credit',
        'pv_detail_id',
        'pv_master_id',
        'supplier_id',
        'customer_id',
        'pv_unique_id',
    ];
}
