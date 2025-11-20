<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Series extends BaseModel
{
    use HasFactory;

    protected $table = 'm_series';
    protected $fillable = ['series_en','series_cn','is_deleted','manufacturer_id'];
}
