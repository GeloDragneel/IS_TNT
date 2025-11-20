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
        Schema::create('t_rv_master', function (Blueprint $table) {
            $table->id();
            $table->string('rv_number',25)->unique();
            $table->string('rv_date',25);

            $table->unsignedBigInteger('customer_id')->nullable();
            $table->foreign('customer_id')
                ->references('id')
                ->on('m_customer')
                ->onDelete('set null');

            $table->unsignedBigInteger('rv_status_id')->nullable();
            $table->foreign('rv_status_id')
                ->references('id')
                ->on('m_invoice_status')
                ->onDelete('set null');

            $table->string('account_code',15);
            $table->string('bank',15);

            $table->string('currency',10)->nullable();
            $table->double('ex_rate',12,4)->nullable()->default(0.0000);

            $table->double('amount_paid',12,2)->nullable()->default(0.00);
            $table->double('base_amount_paid',12,2)->nullable()->default(0.00);

            $table->double('total',12,2)->nullable()->default(0.00);
            $table->double('base_total',12,2)->nullable()->default(0.00);

            $table->double('bank_changes',12,2)->nullable()->default(0.00);
            $table->double('base_bank_changes',12,2)->nullable()->default(0.00);
            
            $table->double('excess_amount',12,2)->nullable()->default(0.00);
            $table->double('base_excess_amount',12,2)->nullable()->default(0.00);
            
            $table->double('invoice_deposit',12,2)->nullable()->default(0.00);
            $table->double('credit_used',12,2)->nullable()->default(0.00);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_rv_master');
    }
};
