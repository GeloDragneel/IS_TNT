<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class ISSettings extends BaseModel{
    
    use HasFactory;

    protected $table = 'd_issettings';

    protected $fillable = [
        'tag',
        'en',
        'cn'
    ];
}
