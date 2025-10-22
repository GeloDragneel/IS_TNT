<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grn_status extends Model
{
    use HasFactory;

    protected $fillable = ['grn_status_en','grn_status_cn'];
    protected $table = 'm_grn_status';
}
