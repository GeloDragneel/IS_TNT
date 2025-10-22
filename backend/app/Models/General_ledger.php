<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class General_ledger extends Model
{
    use HasFactory;

    protected $table = 't_general_ledger';
    protected $fillable = [
        'account_code',
        'transaction_date',
        'acc_table',
        'currency',
        'ex_rate',
        'amount',
        'debit',
        'credit',
        'acc_table_id',
        'customer_id',
        'supplier_id',
        'pay_to',
        'invoice_no',
        'ref_data',
    ];
    public function supplier(){
        return $this->belongsTo(Supplier::class);
    }
    public function customer(){
        return $this->belongsTo(Customer::class);
    }
    public function chartOfAccount(){
        return $this->belongsTo(Charts_of_account::class, 'account_code', 'account_code');
    }
}
