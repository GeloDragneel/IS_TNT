<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class General_entries extends Model
{
    use HasFactory;

    protected $table = 't_general_entries';
    protected $fillable = [
        'jv_no',
        'transaction_date',
        'customer_id',
        'account_code',
        'description',
        'currency',
        'ex_rate',
        'invoice_no',
        'amount',
        'base_amount',
        'debit',
        'credit',
        'ref_id',
    ];
    public function customer(){
        return $this->belongsTo(Customer::class);
    }
    public function chartOfAccount(){
        return $this->belongsTo(Charts_of_account::class, 'account_code', 'account_code');
    }
}
