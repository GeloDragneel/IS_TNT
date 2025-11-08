<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Shipping_stat extends BaseModel
{
    use HasFactory;

    protected $table = 'm_shipping_stat';

    protected $fillable = [
        'shipping_stat_en',
        'shipping_stat_cn',
        'country_code',
        'warehouse',
    ];
    public function warehouseList(){
        return $this->belongsTo(Warehouse::class, 'warehouse', 'wh_code');
    }
    public function countryList(){
        return $this->belongsTo(Countries::class, 'country_code', 'id');
    }
}
