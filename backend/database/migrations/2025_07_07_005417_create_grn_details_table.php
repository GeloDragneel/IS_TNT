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
        Schema::create('m_grn_detail', function (Blueprint $table) {
            $table->id();
            $table->string('grn_no',25);
            $table->string('po_number',25);
            $table->string('grn_date',15);

            $table->unsignedBigInteger('product_id')->nullable();
            $table->foreign('product_id')
                ->references(columns: 'id')
                ->on('m_products')
                ->onDelete('set null');

            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->foreign('supplier_id')
                ->references('id')
                ->on('m_suppliers')
                ->onDelete('set null');

            $table->unsignedBigInteger('po_id')->nullable();
            $table->foreign('po_id')
                ->references('id')
                ->on('t_porder_detail')
                ->onDelete('set null');

            $table->unsignedBigInteger('grn_status_id')->nullable();
            $table->foreign('grn_status_id')
                ->references(columns: 'id')
                ->on('m_grn_status')
                ->onDelete('set null');
                
            $table->integer('qty');
            $table->double('price',12,2)->nullable()->default(0.00);
            $table->double('total',12,2)->nullable()->default(0.00);
            $table->double('base_total',12,2)->nullable()->default(0.00);
            $table->string('currency',15);
            $table->double('ex_rate',12,4)->nullable()->default(0.00)->default(0.0000);
            $table->integer('received_qty')->default(0);
            $table->integer('cartons')->default(0);
            $table->integer('lcm')->default(0);
            $table->integer('bcm')->default(0);
            $table->double('vweight',12,4)->nullable()->default(0.0000);
            $table->double('cbm',12,4)->nullable()->default(0.0000);
            $table->double('nw',12,4)->nullable()->default(0.0000);
            $table->double('cnt_weight',12,2)->nullable()->default(0.0000);
            $table->double('hcm',12,2)->nullable()->default(0.0000);
            $table->double('item_ost',12,2)->nullable()->default(0.0000);
            $table->integer('allocation')->default(0);

            $table->string('warehouse',15);
            $table->string('ap_invoice_no',15);
            $table->double('advance_payment',12,2)->nullable()->default(0.0000);
            $table->double('base_advance_payment',12,2)->nullable()->default(0.0000);
            $table->tinyInteger('imported');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_grn_detail');
    }
};
