<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stock_take_master extends Model
{
    use HasFactory;

    protected $table = 't_stock_take_master';

    protected $fillable = [
        'st_no',
        'date',
        'location',
        'is_deleted',
    ];

    public function details() {
        return $this->hasMany(Stock_take_detail::class, 'st_no', 'st_no');
    }

}
