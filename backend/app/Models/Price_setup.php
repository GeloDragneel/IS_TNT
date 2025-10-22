<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Customer_group;
class Price_setup extends Model
{
    use HasFactory;

    protected $table = 'm_price_setup';
    protected $fillable = [
        'product_id',
        'customer_group_id',
        'type',
        'currency',
        'pcs_or_crtn',
        'deposit',
        'price_a',
        'price_b',
        'price_c',
        'retail_price',
        'preorder_price',
        'profit_prcnt_a',
        'profit_prcnt_b',
        'profit_prcnt_c',
        'price_a_pcs_crtn',
        'price_b_pcs_crtn',
        'price_c_pcs_crtn',
        'price_b_to_pcs_crtn',
        'price_c_to_pcs_crtn',
    ];

    public function customerGroup(){
        return $this->belongsTo(Customer_group::class, 'customer_group_id');
    }
    // In Price_setup.php
    public function productItem(){
        return $this->hasOne(Products::class, 'id', 'product_id');
    }
}
