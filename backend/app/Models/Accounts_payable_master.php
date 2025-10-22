<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Accounts_payable_master extends Model
{
    use HasFactory;
    protected $table = 't_ap_master';
    protected $fillable = [
        'ap_number',
        'ap_date',
        'currency',
        'ex_rate',
        'tax',
        'base_tax',
        'sub_total',
        'base_sub_total',
        'total',
        'base_total',
        'payment',
        'balance',
        'deposit',
        'base_deposit',
        'po_ex_rate',
        'grn_ex_rate',
        'po_adv_pay',
        'grn_base_total',
        'credit_used',
        'base_credit_used',
        'current_credit',
        'base_current_credit',
        'total_deduction',
        'base_total_deduction',
        'supplier_id',
        'invoice_status_id',
        'ship_to_id',
        'bill_to_id',
        'payment_terms_id',
        'delivery_method_id',
        'shipping_terms_id',
        'bank',
        'due_date',
        'delivery_date',
        'tax_group',
        'remarks',
    ];

    public function supplier(){
        return $this->belongsTo(Supplier::class, 'supplier_id', 'id');
    }
    public function invoiceStatus(){
        return $this->belongsTo(Invoice_status::class, 'invoice_status_id', 'id');
    }
    public function apDetails(){
        return $this->hasMany(Accounts_payable_details::class, 'ap_number', 'ap_number');
    }
    public function creditSupplier(){
        return $this->hasOne(Credit_supplier::class, 'supplier_id', 'supplier_id');
    }
}
