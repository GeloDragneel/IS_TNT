<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Product_type extends BaseModel
{
    use HasFactory;

    protected $table = 'm_product_type';
    protected $fillable = ['product_type_en','product_type_cn','is_deleted'];
}
