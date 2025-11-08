<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Sales_order_qty_ids extends BaseModel
{
    use HasFactory;
    protected $table = 't_sales_order_qty_ids';
    protected $fillable = [
        'order_id',
        'po_detail_id',
    ];
    public function order(){
        return $this->belongsTo(Orders::class, 'order_id', 'id');
    }

    public function poDetailId(){
        return $this->belongsTo(Porder_detail::class, 'po_detail_id', 'id');
    }

}
