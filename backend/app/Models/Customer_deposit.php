<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Customer_deposit extends BaseModel{
    use HasFactory;

    protected $table = 't_customer_deposit';

    protected $fillable = [
        'customer_id',
        'invoice_no',
        'product_id',
        'qty',
        'item_deposit',
        'base_item_deposit',
        'used_deposit',
        'currency',
        'order_id',
        'ex_rate',
        'transaction_date',
    ];

}
