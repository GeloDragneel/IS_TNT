<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product_tagging extends Model
{
    use HasFactory;

    protected $fillable = [
        'old_product_code',
        'product_code',
        'product_title_en',
        'product_title_cn',
        'is_tnt',
        'is_wholesale',
        'is_activate_banner',
    ];
    protected $table = 'm_product_tagging_master';


    public function details()
    {
        return $this->hasMany(Product_tagging_details::class, 'product_tagging_master_id');
    }
    public function images()
    {
        return $this->hasMany(Product_images_tagging::class, 'product_id', 'id')->orderBy('rank', 'asc');
    }
    public function taggedProducts()
    {
        return $this->hasManyThrough(
            Products::class,
            Product_tagging_details::class,
            'product_tagging_master_id', // FK on detail
            'id', // FK on product
            'id', // local key on tagging
            'product_id' // FK on detail -> product
        );
    }

}
