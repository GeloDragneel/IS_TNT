<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    protected $table = 'm_customer';

    protected $fillable = [
        'customer_code',
        'old_customer_code',
        'account_name_en',
        'account_name_cn',
        'billing_address_en',
        'billing_address_cn',
        'billing_name_en',
        'billing_name_cn',
        'billing_postal_code',
        'billing_country',
        'billing_state_id',
        'billing_tel_no',
        'billing_fax_no',
        'delivery_address_en',
        'delivery_address_cn',
        'delivery_name_en',
        'delivery_name_cn',
        'delivery_postal_code',
        'delivery_country',
        'delivery_state_id',
        'delivery_tel_no',
        'delivery_fax_no',
        'country',
        'company_en',
        'company_cn',
        'email_address',
        'webpage_address',
        'status',
        'customer_since',
        'currency',
        'memo',
        'shipping_address',
        'credit_limit',
        'price_level',
        'sales_person_id',
        'payment_terms_id',
        'preferred_shipping_id',
        'shipping_terms_id',
        'source_id',
        'user_id',
        'tax_ref_no',
        'tax_group',
        'mobile',
        'password',
        'tel_no',
        'customer_type',
        'pod',
        'rwarehouse',
        'language',
        'is_view_new_order',
        'is_subscribe',
        'is_new_inventory',
    ];

    public function countryList(){
        return $this->belongsTo(Countries::class, 'billing_country', 'id');
    }
    public function countryList2(){
        return $this->belongsTo(Countries::class, 'delivery_country', 'id');
    }
    public function salesPerson(){
        return $this->belongsTo(Employee_Info::class, 'sales_person_id', 'id');
    }
    public function podList(){
        return $this->belongsTo(Warehouse::class, 'pod', 'wh_code');
    }
    public function warehouseList(){
        return $this->belongsTo(Warehouse::class, 'rwarehouse', 'wh_code');
    }
    public function source(){
        return $this->belongsTo(Source::class, 'source_id', 'id');
    }
    public function shippingTerms(){
        return $this->belongsTo(Shipping_terms::class, 'shipping_terms_id', 'id');
    }
    public function emails(){
        return $this->hasMany(Customer_email::class, 'customer_id', 'id');
    }
    public function customer_group(){
        return $this->belongsToMany(
            Customer_group::class,
            'm_customer_group_list', // Pivot table
            'customer_id', // Foreign key on pivot pointing to this model
            'customer_group_id' // Foreign key on pivot pointing to Genre
        );
    }
}
