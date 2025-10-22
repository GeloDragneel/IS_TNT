<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order_status extends Model
{
    use HasFactory;

    protected $fillable = ['status_en','status_cn'];
    protected $table = 'm_order_status';
}
