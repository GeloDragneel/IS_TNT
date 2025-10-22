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
        Schema::create('t_porder_detail', function (Blueprint $table) {
            $table->id();
            $table->string('po_number',25)->unique();

            $table->unsignedBigInteger('product_id')->nullable();
            $table->foreign('product_id')
                ->references('id')
                ->on('m_products')
                ->onDelete('set null');

            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->foreign('supplier_id')
                ->references('id')
                ->on('m_suppliers')
                ->onDelete('set null');

            $table->unsignedBigInteger('postatus_id')->nullable();
            $table->foreign('postatus_id')
                ->references(columns: 'id')
                ->on('m_postatus')
                ->onDelete('set null');

            $table->integer('qty');
            $table->double('price',12,2)->nullable()->default(0.00);
            $table->double('total',12,2)->nullable()->default(0.00);
            $table->double('base_price',12,2)->nullable()->default(0.00);
            $table->double('base_total',12,2)->nullable()->default(0.00);
            $table->double('deposit',12,2)->nullable()->default(0.00);
            $table->double('base_deposit',12,2)->nullable()->default(0.00);
            $table->string('currency',5);
            $table->double('ex_rate',12,4)->nullable()->default(0.00)->default(0.0000);
            $table->double('item_cost',12,2)->nullable()->default(0.00);
            $table->double('retail_price',12,2)->nullable()->default(0.00);
            $table->integer('allocated_qty');
            $table->integer('receive_qty');
            $table->string('receive_date',15);
            $table->string('deposit_rv',15);
            $table->string('deposit_pv',15);
            $table->string('invoice_pv',15);

            $table->tinyInteger('is_allocated');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_porder_detail');
    }
};
