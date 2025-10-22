<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Account_receive_voucher extends Model
{
    use HasFactory;

    protected $table = 't_account_receive_voucher';
    protected $fillable = [
        'account_code',
        'transaction_date',
        'rv_number',
        'customer_id',
        'rv_master_id',
        'currency',
        'ex_rate',
        'amount',
        'base_amount',
        'debit',
        'credit',
        'ar_unique_id',
    ];
}
