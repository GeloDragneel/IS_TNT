<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Brands extends BaseModel
{
    use HasFactory;

    protected $fillable = ['brands_en','brands_cn','is_deleted'];
    protected $table = 'm_brands';
}
