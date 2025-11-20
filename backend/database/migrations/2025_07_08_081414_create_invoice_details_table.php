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
        Schema::create('t_invoice_detail', function (Blueprint $table) {
            $table->id();

            $table->string('invoice_no',25);
            $table->string('invoice_date',25);

            $table->unsignedBigInteger('customer_id')->nullable();
            $table->foreign('customer_id')
                ->references('id')
                ->on('m_customer')
                ->onDelete('set null');

            $table->unsignedBigInteger('product_id')->nullable();
            $table->foreign('product_id')
                ->references('id')
                ->on('m_products')
                ->onDelete('set null');

            $table->unsignedBigInteger('invoice_status_id')->nullable();
            $table->foreign('invoice_status_id')
                ->references('id')
                ->on('m_invoice_status')
                ->onDelete('set null');

            $table->string('currency',10);
            $table->integer('qty');
            $table->double('price',12,2)->nullable()->default(0.00);
            $table->double('total',12,2)->nullable()->default(0.00);
            $table->double('base_total',12,2)->nullable()->default(0.00);
            $table->double('deposit',12,2)->nullable()->default(0.00);
            $table->double('item_cost',12, 2)->nullable()->default(0.00);
            $table->double('ex_rate',12,4)->nullable()->default(0.0000);

            $table->unsignedBigInteger('order_id')->nullable();
            $table->foreign('order_id')
                ->references('id')
                ->on('t_orders')
                ->onDelete('set null');

            $table->unsignedBigInteger('allocated_id')->nullable();
            $table->foreign('allocated_id')
                ->references('id')
                ->on('t_inventory_allocation')
                ->onDelete('set null');

            $table->unsignedBigInteger('grn_detail_id')->nullable();
            $table->foreign('grn_detail_id')
                ->references('id')
                ->on('t_grn_detail')
                ->onDelete('set null');

            $table->unsignedBigInteger('sales_person_id')->nullable();
            $table->foreign('sales_person_id')
                ->references('id')
                ->on('m_employee_info')
                ->onDelete('set null');

            $table->unsignedBigInteger('shipping_stat_id')->nullable();
            $table->foreign('shipping_stat_id')
                ->references('id')
                ->on('m_shipping_stat')
                ->onDelete('set null');

            $table->integer('shipped_qty');
            $table->integer('on_ship_out_qty');
            $table->tinyInteger('product_type');
            $table->string('alloc_type',15);
            $table->string('warehouse',15);
            $table->string('particular',100);
            $table->string('remarks',100);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_invoice_detail');
    }
};
