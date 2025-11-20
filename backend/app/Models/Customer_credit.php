<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Customer_credit extends BaseModel
{
    use HasFactory;

    protected $table = 't_customer_credit';
    protected $fillable = [
        'customer_id',
        'currency',
        'ex_rate',
        'debit',
        'credit',
        'base_debit',
        'base_credit',
        'transaction_date',
        'ref_data',
        'cr_no',
        'rv_number',
        'invoice_no',
        'table_id',
        'type',
        'is_refund',
        'particlars',
        'orders_id',
        'ref_id',
    ];

    public function customer(){
        return $this->hasOne(Customer::class, 'id', 'customer_id');
    }
}
