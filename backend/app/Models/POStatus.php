<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class POStatus extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'postatus_en',
        'postatus_cn',
    ];
    protected $table = 'm_postatus';
}
