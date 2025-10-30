<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice_master extends Model
{
    use HasFactory;

    protected $table = 't_invoice_master';

    protected $fillable = [
        'invoice_no',
        'invoice_date',
        'so_number',
        'customer_id',
        'invoice_status_id',
        'currency',
        'ex_rate',
        'sub_total',
        'base_sub_total',
        'total',
        'base_total',
        'total_deposit',
        'base_total_deposit',
        'total_to_pay',
        'base_total_to_pay',
        'total_deduction',
        'base_total_deduction',
        'payment',
        'balance',
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
        'base_row_total',
        'sub_total_on_cost',
        'tax_amount',
        'base_tax_amount',
        'shipping_stat_id',
        'payment_terms_id',
        'sales_person_id',
        'due_date',
        'delivery_date',
        'invoice_type',
        'cnt_ship',
    ];
    public function customer(){
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }
    public function invoiceStatus(){
        return $this->belongsTo(Invoice_status::class, 'invoice_status_id', 'id');
    }
    public function invoiceDetails(){
        return $this->hasMany(Invoice_detail::class, 'invoice_no', 'invoice_no');
    }
    public function invoiceDetailsCopy(){
        return $this->hasMany(Invoice_detail_copy::class, 'invoice_no', 'invoice_no');
    }
    public function salesPerson(){
        return $this->belongsTo(Employee_Info::class, 'sales_person_id', 'id');
    }
    public function shippingStat(){
        return $this->belongsTo(Shipping_stat::class, 'shipping_stat_id', 'id');
    }
    public function receiveVoucherMasterInvoices(){
        return $this->hasMany(Receive_voucher_master_invoices::class, 'invoice_master_id', 'id');
    }
}
