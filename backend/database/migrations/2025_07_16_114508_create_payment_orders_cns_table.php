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
        Schema::create('t_payment_orders_cn', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('account_customer_cn_id')->nullable();
            $table->foreign('account_customer_cn_id')
                ->references('id')
                ->on('t_account_customer_cn')
                ->onDelete('set null');

            $table->unsignedBigInteger('order_id')->nullable();
            $table->foreign('order_id')
                ->references('id')
                ->on('t_orders')
                ->onDelete('set null');

            $table->double('payment_order',12,2)->nullable()->default(0.00);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_payment_orders_cn');
    }
};
