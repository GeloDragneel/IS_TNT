<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Account_invoice extends Model{
    use HasFactory;

    protected $table = 't_account_invoice';

    protected $fillable = [
        'customer_id',
        'account_code',
        'transaction_date',
        'invoice_no',
        'ex_rate',
        'currency',
        'amount',
        'base_amount',
        'debit',
        'credit',
        'ar_invoice_id',
        'ar_unique_id',
    ];
}
