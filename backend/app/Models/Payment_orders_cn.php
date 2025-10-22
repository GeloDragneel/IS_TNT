<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment_orders_cn extends Model
{
    use HasFactory;

    protected $table = 't_payment_orders_cn';
    protected $fillable = [
        'account_customer_cn_id',
        'order_id',
        'payment_order',
        'is_combined',
        'created_at',
        'updated_at',
    ];
    public function order(){
        return $this->belongsTo(Orders::class, 'order_id');
    }
    public function accountCustomerCn(){
        return $this->belongsTo(Account_customer_cn::class, 'account_customer_cn_id');
    }
}
