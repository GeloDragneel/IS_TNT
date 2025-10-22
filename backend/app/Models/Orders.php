<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\Customer;
use App\Models\Products;

class Orders extends Model
{
    use HasFactory;
    protected $table = 't_orders';

    protected $fillable = [
        'order_id',
        'order_date',
        'customer_id',
        'product_id',
        'currency',
        'ex_rate',
        'qty',
        'allocated_qty',
        'price',
        'base_total',
        'item_deposit',
        'base_item_deposit',
        'e_total_sales',
        'e_total_sales_currency',
        'e_profit',
        'e_profit_currency',
        'e_cost_total',
        'e_cost_total_currency',
        'po_number',
        'price_a',
        'price_b',
        'price_c',
        'price_setup_deposit',
        'price_setup_deposit_currency',
        'pcs_per_carton',
        'pod',
        'rwarehouse',
        'show_category',
        'rvoucher_no',
        'order_status',
        'sales_person_id',
        'shipping_stat_id',
        'customer_group_id',
        'po_detail_id',
        'po_received_qty',
        'voucher_code',
        'customer_group_currency',
        'on_po',
    ];

    public function customer(){
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }
    public function product(){
        return $this->belongsTo(Products::class, 'product_id', 'id');
    }
    public function salesPerson(){
        return $this->belongsTo(Employee_Info::class, 'sales_person_id', 'id');
    }
    public function podList(){
        return $this->belongsTo(Warehouse::class, 'pod', 'wh_code');
    }
    public function rwarehouseList(){
        return $this->belongsTo(Warehouse::class, 'rwarehouse', 'wh_code');
    }
    public function customerGroup(){
        return $this->belongsTo(Customer_group::class, 'customer_group_id', 'id');
    }
    public function status(){
        return $this->belongsTo(Order_status::class, 'order_status', 'id');
    }
}
