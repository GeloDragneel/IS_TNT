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
        Schema::create('t_ap_detail', function (Blueprint $table) {
            $table->id();

            $table->string('ap_number',25);
            $table->string('po_number',25);
            $table->string('ap_date',25);

            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->foreign('supplier_id')
                ->references('id')
                ->on('m_suppliers')
                ->onDelete('set null');

            $table->unsignedBigInteger('product_id')->nullable();
            $table->foreign('product_id')
                ->references('id')
                ->on('m_products')
                ->onDelete('set null');

            $table->string('currency',10)->nullable();
            $table->double('ex_rate',12,4)->nullable()->default(0.0000);

            $table->integer('qty');
            $table->integer('receive_qty');
            $table->double('price',12,2)->nullable()->default(0.00);
            $table->double('total',12,2)->nullable()->default(0.00);
            $table->double('deposit',12,2)->nullable()->default(0.00);
            $table->double('base_deposit',12,2)->nullable()->default(0.00);

            $table->double('po_ex_rate',12,4)->nullable()->default(0.0000);
            $table->double('grn_ex_rate',12,4)->nullable()->default(0.0000);
            $table->double('po_adv_pay',12,2)->nullable()->default(0.00);
            $table->double('grn_base_total',12,2)->nullable()->default(0.00);
            $table->unsignedBigInteger('po_detail_id')->nullable();
            $table->foreign('po_detail_id')
                ->references('id')
                ->on('t_porder_detail')
                ->onDelete('set null');

            $table->tinyInteger('lock_del');
            $table->tinyInteger('product_type');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_ap_detail');
    }
};
