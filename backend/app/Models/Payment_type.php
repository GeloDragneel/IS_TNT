<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Payment_type extends BaseModel{
    use HasFactory;

    protected $table = 'm_payment_type';

    protected $fillable = [
        'payment_type_en',
        'payment_type_cn',
    ];
}
