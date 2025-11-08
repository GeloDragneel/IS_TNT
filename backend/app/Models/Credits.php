<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Credits extends BaseModel
{
    use HasFactory;

    protected $table = 't_credits';
    
    protected $fillable = ['customer_id', 'currency', 'current_credit'];
}
