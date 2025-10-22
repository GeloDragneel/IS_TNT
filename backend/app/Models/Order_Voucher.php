<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order_Voucher extends Model
{
    use HasFactory;

    protected $table = 't_order_voucher';
    protected $fillable = [
        'voucher_date',
        'voucher_no',
        'customer_id',
        'expiry_date',
        'currency',
        'value',
        'status',
    ];
    public function customer(){
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }
}
