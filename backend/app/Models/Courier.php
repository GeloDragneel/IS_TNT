<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Courier extends Model
{
    use HasFactory;

    protected $table = 'm_couriers';
    protected $fillable = ['courier_en','courier_cn','is_deleted','alias'];
}
