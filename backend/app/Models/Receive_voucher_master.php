<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Receive_voucher_master extends Model
{
    use HasFactory;
    
    protected $table = 't_rv_master';

    protected $fillable = [
        'rv_number',
        'rv_date',
        'customer_id',
        'rv_status_id',
        'account_code',
        'bank',
        'currency',
        'ex_rate',
        'amount_paid',
        'base_amount_paid',
        'total',
        'base_total',
        'bank_charges',
        'base_bank_charges',
        'excess_amount',
        'base_excess_amount',
        'invoice_deposit',
        'credit_used',
        'created_at',
        'updated_at',
    ];
    public function customer(){
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }
    public function bank(){
        return $this->belongsTo(Charts_of_account::class, 'bank', 'account_code');
    }
    public function rvDetails() {
        return $this->hasMany(Receive_voucher_detail::class, 'rv_number', 'rv_number');
    }
    public function rvDetailsCopy() {
        return $this->hasMany(Receive_voucher_detail_copy::class, 'rv_number', 'rv_number');
    }
    public function bankAccount() {
        return $this->belongsTo(Charts_of_account::class, 'bank', 'account_code');
    }
    public function chartsAccount() {
        return $this->belongsTo(Charts_of_account::class, 'account_code', 'account_code');
    }
    public function invoiceStatus() {
        return $this->belongsTo(Invoice_status::class, 'rv_status_id');
    }

}
