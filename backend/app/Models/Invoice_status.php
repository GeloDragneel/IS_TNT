<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice_status extends Model
{
    use HasFactory;

    protected $fillable = [
        'status_value',
        'status_value_en',
        'status_value_cn',
    ];
    protected $table = 'm_invoice_status';
}
