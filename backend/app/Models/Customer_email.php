<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer_email extends Model
{
    use HasFactory;

    protected $table = 'm_customer_email';

    protected $fillable = [
        'customer_id',
        'email_address',
        'set_as_default'
    ];

    public function customer(){
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }
}
