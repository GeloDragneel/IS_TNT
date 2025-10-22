<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice_type extends Model{
    
    use HasFactory;

    protected $table = 'm_invoice_type';

    protected $fillable = [
        'invoice_type_en',
        'invoice_type_cn',
    ];
}
