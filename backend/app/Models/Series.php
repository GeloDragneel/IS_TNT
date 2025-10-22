<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Series extends Model
{
    use HasFactory;

    protected $table = 'm_series';
    protected $fillable = ['series_en','series_cn','is_deleted','manufacturer_id'];
}
