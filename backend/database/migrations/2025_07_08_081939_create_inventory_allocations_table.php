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
        Schema::create('t_inventory_allocation', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('grn_detail_id')->nullable();
            $table->foreign('grn_detail_id')
                ->references('id')
                ->on('t_grn_detail')
                ->onDelete('set null');

            $table->unsignedBigInteger('customer_id')->nullable();
            $table->foreign('customer_id')
                ->references('id')
                ->on('m_customer')
                ->onDelete('set null');

            $table->unsignedBigInteger('product_id')->nullable();
            $table->foreign('product_id')
                ->references('id')
                ->on('m_customer')
                ->onDelete('set null');

            $table->unsignedBigInteger('service_id')->nullable();
            $table->foreign('service_id')
                ->references('id')
                ->on('m_product_services')
                ->onDelete('set null');

            $table->integer('qty');
            $table->integer('allocated_qty');
            $table->double('price',12,2)->nullable()->default(0.00);
            $table->double('total',12,2)->nullable()->default(0.00);
            $table->double('deposit',12,2)->nullable()->default(0.00);
            $table->double('voucher_amount',12,2)->nullable()->default(0.00);
            $table->double('base_voucher_amount',12,2)->nullable()->default(0.00);
            $table->string('currency',10)->nullable();
            $table->string('invoice_no',25)->nullable();
            $table->string('grn_no',25)->nullable();
            $table->string('so_number',25)->nullable();
            $table->string('pod',15)->nullable();
            $table->string('warehouse',15)->nullable();
            $table->string('account_no',15)->nullable();

            $table->unsignedBigInteger('po_detail_id')->nullable();
            $table->foreign('po_detail_id')
                ->references('id')
                ->on('t_porder_detail')
                ->onDelete('set null');

            $table->unsignedBigInteger('shipping_stat_id')->nullable();
            $table->foreign('shipping_stat_id')
                ->references('id')
                ->on('m_shipping_stat')
                ->onDelete('set null');

            $table->unsignedBigInteger('sales_person_id')->nullable();
            $table->foreign('sales_person_id')
                ->references('id')
                ->on('m_employee_info')
                ->onDelete('set null');

            $table->unsignedBigInteger('order_id')->nullable();
            $table->foreign('order_id')
                ->references('id')
                ->on('t_orders')
                ->onDelete('set null');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_inventory_allocation');
    }
};
