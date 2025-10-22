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
        Schema::create('t_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_id',25);
            $table->string('order_date',20);

            $table->unsignedBigInteger('customer_id')->nullable();
            $table->foreign('customer_id')
                ->references(columns: 'id')
                ->on('m_customer')
                ->onDelete('set null');

            $table->unsignedBigInteger('product_id')->nullable();
            $table->foreign('product_id')
                ->references(columns: 'id')
                ->on('m_products')
                ->onDelete('set null');

            $table->string('currency',5);
            $table->double('ex_rate',12,4)->nullable()->default(0.0000);

            $table->integer('qty');
            $table->double('price',12,2)->nullable()->default(0.00);
            $table->double('base_total',12,2)->nullable()->default(0.00);
            $table->double('item_deposit',12,2)->nullable()->default(0.00);
            $table->double('base_item_deposit',12,2)->nullable()->default(0.00);
            $table->double('e_total_sales',12,2)->nullable()->default(0.00);
            $table->string('e_total_sales_currency',5)->nullable()->default('');
            $table->double('e_profit',12,2)->nullable()->default(0.00);
            $table->string('e_profit_currency',5)->nullable()->default('');
            $table->double('e_cost_total',12,2)->nullable()->default(0.00);
            $table->string('e_cost_total_currency',5);
            $table->string('po_number',25)->nullable()->default('');
            $table->double('price_a',12,2)->nullable()->default(0.00);
            $table->double('price_b',12,2)->nullable()->default(0.00);
            $table->double('price_c',12,2)->nullable()->default(0.00);
            $table->double('price_setup_deposit',12,2)->nullable()->default(0.00);
            $table->string('price_setup_deposit_currency',5)->nullable()->default('');
            $table->integer('pcs_per_carton')->nullable()->default(0);
            $table->string('pod',10)->nullable()->default('');
            $table->string('rwarehouse',10)->nullable()->default('');
            $table->string('rvoucher_no',255)->nullable()->default('');
            $table->tinyInteger('order_status');

            $table->unsignedBigInteger('sales_person_id')->nullable();
            $table->foreign('sales_person_id')
                ->references(columns: 'id')
                ->on('m_employee_info')
                ->onDelete('set null');

            $table->unsignedBigInteger('shipping_stat_id')->nullable();
            $table->foreign('shipping_stat_id')
                ->references(columns: 'id')
                ->on('m_shipping_stat')
                ->onDelete('set null');

            $table->unsignedBigInteger('customer_group_id')->nullable();
            $table->foreign('customer_group_id')
                ->references(columns: 'id')
                ->on('m_customer_group')
                ->onDelete('set null');

            $table->unsignedBigInteger('po_detail_id')->nullable();
            $table->foreign('po_detail_id')
                ->references(columns: 'id')
                ->on('t_porder_detail')
                ->onDelete('set null');

            $table->integer('po_received_qty')->nullable()->default(0);
            $table->string('voucher_code',10)->nullable()->default('');

            $table->string('customer_group_currency',10)->nullable()->default('');
            $table->tinyInteger('on_po')->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_orders');
    }
};
