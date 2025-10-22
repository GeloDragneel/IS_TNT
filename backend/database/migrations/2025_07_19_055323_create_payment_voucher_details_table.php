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
        Schema::create('t_pv_detail', function (Blueprint $table) {
            $table->id();

            $table->string('pv_number',25)->unique();
            $table->string('pv_date',25);
            $table->string('account_code',25);

            $table->unsignedBigInteger('product_id')->nullable();
            $table->foreign('product_id')
                ->references('id')
                ->on('m_products')
                ->onDelete('set null');

            $table->unsignedBigInteger('payment_type_id')->nullable();
            $table->foreign('payment_type_id')
                ->references('id')
                ->on('m_payment_type')
                ->onDelete('set null');

            $table->unsignedBigInteger('po_detail_id')->nullable();
            $table->foreign('po_detail_id')
                ->references('id')
                ->on('t_porder_detail')
                ->onDelete('set null');

            $table->unsignedBigInteger('ap_detail_id')->nullable();
            $table->foreign('ap_detail_id')
                ->references('id')
                ->on('t_ap_detail')
                ->onDelete('set null');

            $table->integer('qty');
            $table->string('account_no',25);
            $table->string('ap_invoice_no',25);
            $table->string('ref_data',25);

            $table->string('currency',10)->nullable();
            $table->double('ex_rate',12,4)->nullable()->default(0.0000);

            $table->double('amount',12,2)->nullable()->default(0.00);
            $table->double('base_amount',12,2)->nullable()->default(0.00);
            $table->double('ex_rate_diff',12,2)->nullable()->default(0.00);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_pv_detail');
    }
};
