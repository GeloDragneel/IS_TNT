<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Most_viewed_product extends Model
{
    use HasFactory;

    protected $table = 't_most_viewed_product';

    protected $fillable = [
        'product_id',
        'count',
    ];

    public function product(){
        return $this->belongsTo(Products::class, 'product_id', 'id');
    }
}