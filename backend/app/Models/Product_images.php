<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Product_images extends BaseModel
{
    use HasFactory;

    protected $table = 'm_product_images';
    protected $fillable = ['product_id','type','path','rank'];
}
