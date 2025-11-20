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
        Schema::create('t_accounts_receivable', function (Blueprint $table) {
            $table->id();

            $table->string('account_code',25);
            $table->string('account_description',255);
            $table->string('transaction_date',25);
            $table->string('invoice_no',25);

            $table->unsignedBigInteger('customer_id')->nullable();
            $table->foreign('customer_id')
                ->references('id')
                ->on('m_customer')
                ->onDelete('set null');

            $table->unsignedBigInteger('invoice_id')->nullable();
            $table->foreign('invoice_id')
                ->references('id')
                ->on('t_invoice_master')
                ->onDelete('set null');

            $table->string('currency',10);

            $table->double('ex_rate',12,2)->nullable()->default(0.00);
            $table->double('debit',12,2)->nullable()->default(0.00);
            $table->double('credit',12,2)->nullable()->default(0.00);
            $table->double('amount_paid',12,2)->nullable()->default(0.00);
            $table->double('base_amount',12,2)->nullable()->default(0.00);
            $table->double('balance',12,2)->nullable()->default(0.00);
            $table->tinyInteger('is_trigger')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_accounts_receivable');
    }
};
