<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shipping_terms extends Model
{
    use HasFactory;

    protected $table = 'm_shipping_terms';
    protected $fillable = ['shipping_terms_en','shipping_terms_cn','is_deleted'];
}
