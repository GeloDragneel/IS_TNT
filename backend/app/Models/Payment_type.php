<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment_type extends Model{
    use HasFactory;

    protected $table = 'm_payment_type';

    protected $fillable = [
        'payment_type_en',
        'payment_type_cn',
    ];
}
