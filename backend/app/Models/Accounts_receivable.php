<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Accounts_receivable extends Model
{
    use HasFactory;
    protected $table = 't_accounts_receivable';
    protected $fillable = [
        'account_code',
        'account_description',
        'transaction_date',
        'invoice_no',
        'customer_id',
        'invoice_id',
        'currency',
        'ex_rate',
        'debit',
        'credit',
        'amount_paid',
        'base_amount',
        'balance',
        'is_trigger',
    ];
    public function customer(){
        return $this->hasOne(Customer::class, 'id', 'customer_id');
    }
    public function chartsAccount() {
        return $this->belongsTo(Charts_of_account::class, 'account_code', 'account_code');
    }
}
