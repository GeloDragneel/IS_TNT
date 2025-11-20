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
        Schema::create('t_account_payment_voucher', function (Blueprint $table) {
            $table->id();

            $table->string('account_code',40);
            $table->string('transaction_date',20);
            $table->string('pv_number',30);
            $table->string('currency',10);
            $table->double('ex_rate',12,4)->nullable()->default(0.00);
            $table->double('amount',12,2)->nullable()->default(0.00);
            $table->double('base_amount',12,2)->nullable()->default(0.00);
            $table->double('debit',12,2)->nullable()->default(0.00);
            $table->double('credit',12,2)->nullable()->default(0.00);

            $table->unsignedBigInteger('pv_detail_id')->nullable();
            $table->foreign('pv_detail_id')
                ->references('id')
                ->on('t_pv_detail')
                ->onDelete('set null');

            $table->unsignedBigInteger('pv_master_id')->nullable();
            $table->foreign('pv_master_id')
                ->references('id')
                ->on('t_pv_master')
                ->onDelete('set null');

            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->foreign('supplier_id')
                ->references('id')
                ->on('m_suppliers')
                ->onDelete('set null');

            $table->unsignedBigInteger('customer_id')->nullable();
            $table->foreign('customer_id')
                ->references('id')
                ->on('m_customer')
                ->onDelete('set null');

            $table->string('pv_unique_id',30);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_account_payment_voucher');
    }
};
