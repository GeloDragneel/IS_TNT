<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Account_customer_cn extends BaseModel
{
    use HasFactory;

    protected $table = 't_account_customer_cn';
    protected $fillable = [
        'customer_id',
        'transaction_date',
        'account_code',
        'amount',
        'base_amount',
        'credit',
        'debit',
        'ex_rate',
        'cr_detail_id',
        'rv_detail_id',
        'rv_master_id',
        'invoice_id',
        'particulars',
        'currency',
        'ref_data',
        'updated_at',
    ];

    // In Account_customer_cn.php
    public function paymentOrders(){
        return $this->hasMany(Payment_orders_cn::class, 'account_customer_cn_id');
    }
    public function order(){
        return $this->belongsTo(Orders::class, 'order_id');
    }
    public function account(){
        return $this->belongsTo(Charts_of_account::class, 'account_code', 'account_code');
    }
    public function creditNoteDetails(){
        return $this->hasMany(CreditNoteCustomerDetail::class, 'cr_number', 'ref_data');
    }
    public function customer(){
        return $this->hasOne(Customer::class, 'id', 'customer_id');
    }

}
class CreditNoteCustomerDetail extends Model{
    protected $table = 't_credit_note_customer_detail';
    protected $fillable = ['cr_number', 'account_code']; // define other fields as necessary
}