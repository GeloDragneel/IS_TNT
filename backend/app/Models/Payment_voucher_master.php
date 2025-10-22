<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment_voucher_master extends Model{
    use HasFactory;
    protected $table = 't_pv_master';
    protected $fillable = [
        'pv_number',
        'pv_date',
        'pay_to_en',
        'pay_to_cn',
        'particular_en',
        'particular_cn',
        'currency',
        'ex_rate',
        'total_amount',
        'base_total_amount',
        'sub_total',
        'base_sub_total',
        'tax_amount',
        'base_tax_amount',
        'bank_charges',
        'base_bank_charges',
        'credit_used',
        'deposits',
        'tax_group',
        'bank',
        'customer_id',
        'pv_status_id',
        'supplier_id',
        'payment_type_id',
        'ref_data',
        'invoice_no',
        'chart_fix_code',
    ];

    public function supplier(){
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }
    public function customer(){
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }
    public function paymentType(){
        return $this->belongsTo(Payment_type::class, 'payment_type_id', 'id');
    }
    public function invoiceStatus(){
        return $this->belongsTo(Invoice_status::class, 'pv_status_id', 'id');
    }
    public function chartOfAccount(){
        return $this->belongsTo(Charts_of_account::class, 'bank', 'account_code');
    }
    public function details(){
        return $this->hasMany(Payment_voucher_detail::class, 'pv_number', 'pv_number');
    }
    public function detailsCopy(){
        return $this->hasMany(Payment_voucher_detail_copy::class, 'pv_number', 'pv_number');
    }
}
