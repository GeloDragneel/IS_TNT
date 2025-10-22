<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Grn_master extends Model
{
    use HasFactory;

    protected $table = 't_grn_master';

    protected $fillable = [
        'grn_no',
        'supplier_id',
        'grn_date',
        'total',
        'base_total',
        'invoice_deposit',
        'ex_rate',
        'currency',
        'shipping_Stat_id',
        'shipper_id',
        'company_id',
        'grn_status_id',
        'warehouse',
        'imported',
    ];
    public function supplier(){
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }
    public function grnDetails() {
        return $this->hasMany(Grn_details::class, 'grn_no', 'grn_no');
    }
    public function grnStatus(){
        return $this->belongsTo(Grn_status::class, 'grn_status_id', 'id');
    }
    public function storeLocation(){
        return $this->belongsTo(Store_location::class, 'company_id', 'id');
    }
    public function whlist(){
        return $this->belongsTo(Warehouse::class, 'warehouse', 'wh_code');
    }
}
