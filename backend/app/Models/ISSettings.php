<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ISSettings extends Model{
    
    use HasFactory;

    protected $table = 'd_issettings';

    protected $fillable = [
        'tag',
        'en',
        'cn'
    ];
}
