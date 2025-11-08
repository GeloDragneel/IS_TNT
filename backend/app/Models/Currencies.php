<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Currencies extends BaseModel
{
    use HasFactory;

    protected $table = 'm_currencies';
    protected $fillable = ['currency_title','code','set_as_default','is_deleted'];
}
