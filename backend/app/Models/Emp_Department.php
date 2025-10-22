<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Emp_Department extends Model
{
    use HasFactory;

    protected $table = 'm_emp_department';

    protected $fillable = [
        'alias',
        'description_en',
        'description_cn',
    ];

}
