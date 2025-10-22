<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product_images_tagging extends Model
{
    use HasFactory;

    protected $table = 'm_product_images_tagging';
    protected $fillable = ['product_id','type','path','rank'];
}
