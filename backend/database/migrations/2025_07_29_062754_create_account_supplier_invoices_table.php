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
        Schema::create('t_account_supplier_invoice', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->foreign('supplier_id')
                ->references('id')
                ->on('m_suppliers')
                ->onDelete('set null');

            $table->unsignedBigInteger('ap_detail_id')->nullable();
            $table->foreign('ap_detail_id')
                ->references('id')
                ->on('t_ap_detail')
                ->onDelete('set null');

            $table->unsignedBigInteger('pv_detail_id')->nullable();
            $table->foreign('pv_detail_id')
                ->references('id')
                ->on('t_pv_detail')
                ->onDelete('set null');

            $table->string('account_code',10)->nullable();
            $table->string('transaction_date',25)->nullable();
            $table->string('ap_invoice_no',25)->nullable();
            $table->string('pv_number',25)->nullable();
            $table->double('ex_rate',12,4)->nullable()->default(0.0000);
            $table->string('currency',10)->nullable();
            $table->double('sub_total',12,2)->nullable()->default(0.00);
            $table->double('base_sub_total',12,2)->nullable()->default(0.00);
            $table->double('tax_amount',12,2)->nullable()->default(0.00);
            $table->double('base_tax_amount',12,2)->nullable()->default(0.00);
            $table->double('deposit',12,2)->nullable()->default(0.00);
            $table->double('base_deposit',12,2)->nullable()->default(0.00);
            $table->double('amount',12,2)->nullable()->default(0.00);
            $table->double('debit',12,2)->nullable()->default(0.00);
            $table->double('credit',12,2)->nullable()->default(0.00);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_account_supplier_invoice');
    }
};
