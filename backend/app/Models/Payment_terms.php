<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Payment_terms extends BaseModel
{
    use HasFactory;

    protected $table = 'm_payment_terms';

    protected $fillable = [
        'alias',
        'payment_terms_en',
        'payment_terms_cn',
        'terms',
    ];
}
