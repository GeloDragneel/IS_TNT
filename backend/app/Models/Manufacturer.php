<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Manufacturer extends Model
{
    use HasFactory;

    protected $table = 'm_manufacturer';
    protected $fillable = ['manufacturer_en','manufacturer_cn','is_deleted'];
}
