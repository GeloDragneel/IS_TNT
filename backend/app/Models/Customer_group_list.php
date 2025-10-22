<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer_group_list extends Model
{
    use HasFactory;

    protected $table = 'm_customer_group_list';
    protected $fillable = ['customer_id','customer_group_id','set_as_default'];

    public function customerGroup(){
        return $this->belongsTo(Customer_group::class, 'customer_group_id', 'id');
    }
    public function customer(){
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }
}
