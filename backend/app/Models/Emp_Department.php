<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Emp_Department extends BaseModel
{
    use HasFactory;

    protected $table = 'm_emp_department';

    protected $fillable = [
        'alias',
        'description_en',
        'description_cn',
    ];

}
