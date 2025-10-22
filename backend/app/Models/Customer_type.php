<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer_type extends Model
{
    use HasFactory;

    protected $fillable = ['code','description_en','description_cn'];
    protected $table = 'm_customer_type';
}
