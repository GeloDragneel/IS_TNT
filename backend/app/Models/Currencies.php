<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Currencies extends Model
{
    use HasFactory;

    protected $table = 'm_currencies';
    protected $fillable = ['currency_title','code','set_as_default','is_deleted'];
}
