<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Forex extends BaseModel
{
    use HasFactory;

    protected $table = 'm_forex';

    protected $fillable = [
        'from_currency',
        'to_currency',
        'ex_rate',
        'date_enter',
    ];
}
