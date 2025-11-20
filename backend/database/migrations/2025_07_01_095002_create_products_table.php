<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('m_products', function (Blueprint $table) {
            $table->id();
            $table->string('product_code');
            $table->string('old_product_code');
            $table->string('barcode');
            $table->string('product_title_en');
            $table->string('product_title_cn');
            $table->string('product_status');
            $table->tinyInteger('is_tnt');
            $table->tinyInteger('is_wholesale');
            $table->tinyInteger('is_pricesetup');
            $table->tinyInteger('is_deleted');
            $table->tinyInteger('is_po_qty')->default(0);
            $table->double('item_weight', 10, 2)->nullable()->default(0.00);
            $table->unsignedBigInteger('product_type_id')->nullable();
            $table->unsignedBigInteger('menufacturer_id')->nullable();
            $table->unsignedBigInteger('brand_id')->nullable();
            $table->unsignedBigInteger('series_id')->nullable();
            $table->foreign('product_type_id')->references('id')->on('m_product_type')->onDelete('cascade');
            $table->foreign('menufacturer_id')->references('id')->on('m_manufacturer')->onDelete('cascade');
            $table->foreign('brand_id')->references('id')->on('m_brands')->onDelete('cascade');
            $table->foreign('series_id')->references('id')->on('m_series')->onDelete('cascade');
            $table->integer('inventry_qty')->nullable();
            $table->integer('hold_qty')->nullable();
            $table->double('item_cost', 10, 2)->nullable()->default(0.00);
            $table->string('item_cost_currency')->nullable();
            $table->double('offered_cost', 10, 2)->nullable()->default(0.00);
            $table->integer('supplier_id')->nullable();
            $table->string('supplier_currency')->nullable();
            $table->string('rwarehouse')->nullable();
            $table->double('pcs_per_carton', 10, 2)->nullable()->default(0.00);
            $table->string('po_dateline')->nullable();
            $table->string('preorder_start_date')->nullable();
            $table->string('preorder_end_date')->nullable();
            $table->string('preorder_dateline')->nullable();
            $table->string('last_received_date')->nullable();
            $table->string('last_sold_date')->nullable();
            $table->string('cost_update_date')->nullable();
            $table->longText('product_description_en')->nullable();
            $table->longText('product_description_cn')->nullable();
            $table->longText('product_specs_en')->nullable();
            $table->longText('product_specs_cn')->nullable();
            $table->longText('product_demo_en')->nullable();
            $table->longText('product_demo_cn')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_products');
    }
};
