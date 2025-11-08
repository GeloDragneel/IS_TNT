<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Credit_note_customer extends BaseModel
{
    use HasFactory;

    protected $table = 't_credit_note_customer_master';

    protected $fillable = [
        'cr_number',
        'cr_date',
        'customer_id',
        'currency',
        'ex_rate',
        'amount',
        'base_amount',
        'cr_status_id',
        'particulars',
        'account_code',
    ];

    public function customer(){
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }
    public function invoiceStatus(){
        return $this->belongsTo(Invoice_status::class, 'cr_status_id', 'id');
    }
    public function details(){
        return $this->hasMany(Credit_note_customer_detail::class, 'cr_number', 'cr_number');
    }
    public function detailsCopy(){
        return $this->hasMany(Credit_note_customer_detail_copy::class, 'cr_number', 'cr_number');
    }
}
