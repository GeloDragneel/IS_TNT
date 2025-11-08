<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Audit_logs extends Model
{
    use HasFactory;

    protected $table = 'audit_logs';

    protected $fillable = [
        'table_name',
        'table_id',
        'table_action',
        'table_data',
        'user_id',
    ];
}
