<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class POrder_master extends BaseModel
{
    use HasFactory;
    
    protected $table = 't_porder_master';
    protected $fillable = [
        'po_number',
        'po_date',
        'supplier_id',
        'currency',
        'ex_rate',
        'po_amount',
        'base_currency',
        'deposit',
        'base_deposit',
        'bank_charges',
        'base_bank_charges',
        'bank',
        'supplier_id',
        'procurement_by_id',
        'postatus_id',
        'payment_terms_id',
        'delivery_method_id',
        'shipping_terms_id',
        'due_date',
        'delivery_date',
        'ship_to',
    ];
    
    public function supplier(){
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }
    public function details(){
        return $this->hasMany(POrder_detail::class, 'po_number', 'po_number');
    }
    public function detailsCopy(){
        return $this->hasMany(POrder_detail_copy::class, 'po_number', 'po_number');
    }
    public function invoiceStatus(){
        return $this->belongsTo(POStatus::class, 'postatus_id', 'id');
    }
    public function accountSupplier(){
        return $this->hasMany(Account_supplier_cn::class, 'ref_data', 'po_number');
    }
    public function bankList(){
        return $this->belongsTo(Charts_of_account::class, 'bank', 'account_code');
    }
    public function pvDetails(){
        return $this->hasMany(Payment_voucher_detail::class, 'ref_data', 'po_number');
    }
    public function creditSupplier(){
        return $this->hasOne(Credit_supplier::class, 'supplier_id', 'supplier_id');
    }
}
