<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class POStatus extends Model
{
    use HasFactory;

    protected $fillable = [
        'postatus_en',
        'postatus_cn',
    ];
    protected $table = 'm_postatus';
}
