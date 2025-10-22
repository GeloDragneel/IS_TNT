<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stock_take_detail extends Model
{
    use HasFactory;

    protected $table = 't_stock_take_detail';

    protected $fillable = [
        'st_no',
        'date',
        'product_id',
        'location',
        'qty',
        'physical_qty',
    ];
    public function product(){
        return $this->belongsTo(Products::class, 'product_id');
    }
}
