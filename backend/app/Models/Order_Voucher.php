<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Order_Voucher extends BaseModel
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
