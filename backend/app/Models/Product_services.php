<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Product_services extends BaseModel
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
