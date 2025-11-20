<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Manufacturer extends BaseModel
{
    use HasFactory;

    protected $table = 'm_manufacturer';
    protected $fillable = ['manufacturer_en','manufacturer_cn','is_deleted'];
}
