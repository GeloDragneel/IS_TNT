<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Internal_Transfer extends BaseModel{
    use HasFactory;
    
    protected $table = 't_internal_transfer';

    protected $fillable = [
        'transfer_no',
        'transfer_ext',
        'transfer_date',
        'received_date',
        'product_id',
        'warehouse_from',
        'warehouse_to',
        'qty',
        'rem_qty',
        'inventory_id',
        'is_confirmed',
        'user_id',
        'receiver_id',
        'is_deleted',
    ];
    public function product(){
        return $this->belongsTo(Products::class, 'product_id', 'id');
    }
    public function whTo(){
        return $this->belongsTo(Warehouse::class, 'warehouse_to', 'wh_code');
    }
    public function sender(){
        return $this->belongsTo(Login::class, 'user_id', 'id');
    }
    public function receiver(){
        return $this->belongsTo(Login::class, 'receiver_id', 'id');
    }
}
