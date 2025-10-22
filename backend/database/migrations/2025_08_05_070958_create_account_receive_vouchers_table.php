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
        Schema::create('t_account_receive_voucher', function (Blueprint $table) {
            $table->id();

            $table->string('account_code',25);
            $table->string('transaction_date',25);
            $table->string('rv_number',25);

            $table->unsignedBigInteger('customer_id')->nullable();
            $table->foreign('customer_id')
                ->references('id')
                ->on('m_customer')
                ->onDelete('set null');

            $table->unsignedBigInteger('rv_master_id')->nullable();
            $table->foreign('rv_master_id')
                ->references('id')
                ->on('t_rv_master')
                ->onDelete('set null');

            $table->string('currency',25);
            $table->double('ex_rate',12,2)->nullable()->default(0.00);
            $table->double('amount',12,2)->nullable()->default(0.00);
            $table->double('base_amount',12,2)->nullable()->default(0.00);
            $table->double('debit',12,2)->nullable()->default(0.00);
            $table->double('credit',12,2)->nullable()->default(0.00);
            
            $table->string('ar_unique_id',25);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_account_receive_voucher');
    }
};
