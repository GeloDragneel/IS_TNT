<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Operator extends BaseModel
{
    use HasFactory;

    protected $table = 'm_operator';
    protected $fillable = [
        'convertion',
        'operator',
    ];
}
