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
        Schema::create('t_customer_credit', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('customer_id')->nullable();
            $table->foreign('customer_id')
                ->references('id')
                ->on('m_customer')
                ->onDelete('set null');

            $table->string('currency',10)->nullable();
            $table->double('ex_rate',12,4)->nullable()->default(0.0000);

            $table->double('debit',12,2)->nullable()->default(0.00);
            $table->double('credit',12,2)->nullable()->default(0.00);
            
            $table->double('base_debit',12,2)->nullable()->default(0.00);
            $table->double('base_credit',12,2)->nullable()->default(0.00);

            $table->string('transaction_date',25);
            $table->string('ref_data',25);
            $table->string('cr_no',25);
            $table->string('rv_number',25);
            $table->string('invoice_no',25);
            $table->string('table_id',25);
            $table->string('type',10);
            $table->string('is_refund',25);
            $table->string('particlars',60);
            $table->string('orders_id',255);
            $table->integer('ref_id');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_customer_credit');
    }
};
