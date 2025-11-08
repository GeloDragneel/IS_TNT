<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Credit_supplier extends BaseModel
{
    use HasFactory;

    protected $table = 't_credit_supplier';
    
    protected $fillable = ['supplier_id', 'currency', 'current_credit'];
}
