<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sales_order_master extends Model{

    use HasFactory;

    protected $fillable = [
        'so_number',
        'invoice_no',
        'so_date',
        'customer_id',
        'invoice_type',
        'shipping_stat_id',
        'payment_terms_id',
        'sales_person_id',
        'invoice_status_id',
        'currency',
        'ex_rate',
        'total',
        'base_total',
        'sub_total',
        'base_sub_total',
        'total_deposit',
        'base_total_deposit',
        'total_to_pay',
        'base_total_to_pay',
        'total_deduction',
        'base_total_deduction',
        'payment',
        'current_credit',
        'base_current_credit',
        'credit_used',
        'base_credit_used',
        'cr_amount',
        'base_cr_amount',
        'adv_amount',
        'base_adv_amount',
        'excess_amount',
        'base_excess_amount',
        'voucher_amount',
        'base_voucher_amount',
        'sub_total_on_cost',
        'due_date',
        'delivery_date',
        'tax',
        'tax_amount',
        'base_tax_amount',
        'cnt_products',
        'created_at',
        'updated_at',
    ];
    protected $table = 't_so_master';

    public function customer(){
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }
    public function shippingStat(){
        return $this->belongsTo(Shipping_stat::class, 'shipping_stat_id', 'id');
    }
    public function paymentTerms(){
        return $this->belongsTo(Payment_terms::class, 'payment_terms_id', 'id');
    }
    public function credits(){
        return $this->belongsTo(Credits::class, 'customer_id', 'customer_id');
    }
    public function invoiceStatus(){
        return $this->belongsTo(Invoice_status::class, 'invoice_status_id', 'id');
    }
    public function salesOrderDetails(){
        return $this->hasMany(Sales_order_detail::class, 'so_number', 'so_number');
    }
    public function salesOrderDetailsCopy(){
        return $this->hasMany(Sales_order_detail_copy::class, 'so_number', 'so_number');
    }
}
