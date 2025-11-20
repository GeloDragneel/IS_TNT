<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Credit_note_supplier_master extends BaseModel
{
    use HasFactory;

    protected $table = 't_credit_note_supplier_master';

    protected $fillable = [
        'supplier_id',
        'cr_number',
        'cr_status_id',
        'currency',
        'ex_rate',
        'cr_date',
        'amount',
        'base_amount',
        'remarks_en',
        'remarks_cn',
    ];
    
    public function supplier(){
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }
    public function invoiceStatus(){
        return $this->belongsTo(Invoice_status::class, 'cr_status_id', 'id');
    }
    public function details(){
        return $this->hasMany(Credit_note_supplier_detail::class, 'cr_number', 'cr_number');
    }

}
