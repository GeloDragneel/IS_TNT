<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Price_setup;
use App\Models\Product_images;

use App\Models\BaseModel;

class Products extends BaseModel
{
    use HasFactory;

    protected $table = 'm_products';

    protected $fillable = [
        'product_code',
        'old_product_code',
        'barcode',
        'product_title_en',
        'product_title_cn',
        'product_status',
        'is_tnt',
        'is_wholesale',
        'is_pricesetup',
        'is_deleted',
        'is_po_qty',
        'is_import',
        'item_weight',
        'product_type_id',
        'manufacturer_id',
        'brand_id',
        'series_id',
        'inventry_qty',
        'hold_qty',
        'item_cost',
        'item_cost_currency',
        'offered_cost',
        'supplier_id',
        'supplier_currency',
        'rwarehouse',
        'pcs_per_carton',
        'po_dateline',
        'preorder_start_date',
        'preorder_end_date',
        'preorder_dateline',
        'last_received_date',
        'last_sold_date',
        'cost_update_date',
        'product_description_en',
        'product_description_cn',
        'product_specs_en',
        'product_specs_cn',
        'product_demo_en',
        'product_demo_cn',
        'shipping_cost',
        'shipping_currency',
        'created_date',
        'release_date',
        'is_active_banner',
    ];
    public function priceSetup(){
        return $this->hasOne(Price_setup::class, 'product_id', 'id');
    }
    public function images(){
        return $this->hasMany(Product_images::class, 'product_id', 'id')->orderBy('rank', 'asc');
    }
    public function genres(){
        return $this->belongsToMany(
            Genre::class,
            'm_product_genre', // Pivot table
            'product_id', // Foreign key on pivot pointing to this model
            'genre_id' // Foreign key on pivot pointing to Genre
        );
    }
    public function supplier(){
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }
    public function inventory(){
        return $this->hasMany(Inventory_tblmaster::class, 'product_id', 'id');
    }
    public function invoiceDetails(){
        return $this->hasMany(Invoice_detail::class, 'product_id', 'id');
    }
    public function priceList(){
        return $this->hasMany(Price_setup::class, 'product_id', 'id');
    }
    public function series(){
        return $this->belongsTo(Series::class, 'series_id');
    }
    public function manufacturer(){
        return $this->belongsTo(Manufacturer::class, 'manufacturer_id');
    }
    public function brand(){
        return $this->belongsTo(Brands::class, 'brand_id');
    }
}
