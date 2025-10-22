<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    use HasFactory;

    protected $table = 'm_warehouse';
    protected $fillable = [
        'wh_code',
        'warehouse_en',
        'warehouse_cn',
        'country_code',
        'currency',
        'is_deleted',
    ];

    public function countryList(){
        return $this->belongsTo(Countries::class, 'country_code', 'id');
    }

}
