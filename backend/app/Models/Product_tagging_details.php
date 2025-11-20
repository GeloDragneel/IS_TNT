<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Product_tagging_details extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'product_tagging_master_id',
        'product_id',
    ];
    protected $table = 'm_product_tagging_detail';

    public function product()
    {
        return $this->belongsTo(Products::class, 'product_id');
    }
}
