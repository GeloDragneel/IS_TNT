<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Store_location extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_name_en',
        'store_name_cn',
        'address_en',
        'address_cn',
        'set_as_default',
    ];
    protected $table = 'm_store_location';
}
