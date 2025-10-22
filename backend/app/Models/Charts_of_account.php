<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Charts_of_account extends Model
{
    use HasFactory;

    protected $table = 'm_charts_of_account';
    protected $fillable = [
        'root_name',
        'account_code',
        'account_name_en',
        'account_name_cn',
        'account_type_en',
        'account_type_cn',
        'description_en',
        'description_cn',
        'created_at',
        'updated_at',
    ];
}
