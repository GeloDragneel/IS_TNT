<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product_services extends Model
{
    use HasFactory;

    protected $fillable = [
        'service_code',
        'old_service_code',
        'description_en',
        'description_cn',
        'is_deleted',
    ];
    protected $table = 'm_product_services';
}
