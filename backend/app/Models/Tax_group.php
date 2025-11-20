<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Tax_group extends BaseModel
{
    use HasFactory;

    protected $table = 'm_tax_group';
    protected $fillable = [
        'tax_value',
        'tax',
    ];
}
