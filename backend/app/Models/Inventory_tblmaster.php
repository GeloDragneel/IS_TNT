<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory_tblmaster extends Model{
    
    use HasFactory;
    protected $table = 't_inventory_tblmaster';

    protected $fillable = [
        'product_id',
        'qty',
        'allocated_qty',
        'warehouse',
        'from_grn',
        'physical_qty',
    ];

    public function product(){
        return $this->belongsTo(Products::class, 'product_id', 'id');
    }
    public function whList(){
        return $this->belongsTo(Warehouse::class, 'warehouse', 'wh_code');
    }
}
