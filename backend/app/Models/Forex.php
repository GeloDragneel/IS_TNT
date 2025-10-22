<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Forex extends Model
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
