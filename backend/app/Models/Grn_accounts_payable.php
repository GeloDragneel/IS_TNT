<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grn_accounts_payable extends Model
{
    use HasFactory;

    protected $table = 't_grn_accounts_payable';
    protected $fillable = [
        'grn_no',
        'transaction_date',
        'account_code',
        'account_description',
        'product_id',
        'supplier_id',
        'pv_detail_id',
        'po_detail_id',
        'currency',
        'amount',
        'base_amount',
        'debit',
        'credit',
        'balance',
    ];
}
