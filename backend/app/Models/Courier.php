<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Courier extends BaseModel
{
    use HasFactory;

    protected $table = 'm_couriers';
    protected $fillable = ['courier_en','courier_cn','is_deleted','alias'];
}
