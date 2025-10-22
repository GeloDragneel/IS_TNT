<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Accounting_settings extends Model
{
    use HasFactory;

    protected $table = 'd_accounting_settings';
    protected $fillable = [
        'account_name_en',
        'account_name_cn',
        'account_desc_en',
        'account_desc_cn',
        'account_code',
        'chart_acc_id',
        'chart_fix_code',
    ];
}
