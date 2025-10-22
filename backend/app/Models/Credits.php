<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Credits extends Model
{
    use HasFactory;

    protected $table = 't_credits';
    
    protected $fillable = ['customer_id', 'currency', 'current_credit'];
}
