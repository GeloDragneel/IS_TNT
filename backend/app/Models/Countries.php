<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Countries extends Model
{
    use HasFactory;

    protected $table = 'm_countries';
    protected $fillable = [
        'country_en',
        'country_cn',
        'country_code',
        'iso3',
        'phone_code',
        'capital',
        'currency',
        'region',
        'sub_region'
    ];
}
