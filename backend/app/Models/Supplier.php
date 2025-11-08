<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\BaseModel;

class Supplier extends BaseModel
{
    use HasFactory;

    protected $table = 'm_suppliers';

    protected $fillable = [
        'supplier_code',
        'old_supplier_code',
        'suppliername_en',
        'suppliername_cn',
        'contact_person_en',
        'contact_person_cn',
        'supplier_address_en',
        'supplier_address_cn',
        'contact_number',
        'country',
        'country_state',
        'postal_code',
        'fax',
        'email',
        'bank_name_en',
        'bank_name_cn',
        'bank_account_name_en',
        'bank_account_name_cn',
        'bank_account_no',
        'bank_address_en',
        'bank_address_cn',
        'bank_country',
        'bank_country_state',
        'bank_tel_no',
        'bank_swift_code',
        'bank_postal_code_2',
        'currency',
        'iban',
        'tax',
        'payment_terms_id',
        'shipping_terms_id',
        'delivery_method_id',
        'is_deleted',
    ];

    public function countryList(){
        return $this->belongsTo(Countries::class, 'country', 'id');
    }
    public function paymentTerms(){
        return $this->belongsTo(Payment_terms::class, 'payment_terms_id', 'id');
    }
    public function deliveryMethod(){
        return $this->belongsTo(Courier::class, 'delivery_method_id', 'id');
    }
    public function shippingTerms(){
        return $this->belongsTo(Shipping_terms::class, 'shipping_terms_id', 'id');
    }
}
