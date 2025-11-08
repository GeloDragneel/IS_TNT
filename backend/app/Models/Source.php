<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Source extends BaseModel
{
    use HasFactory;

    protected $table = 'm_source';

    protected $fillable = [
        'description_en',
        'description_cn',
    ];
}
