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
        Schema::create('t_account_customer_cn', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('customer_id')->nullable();
            $table->foreign('customer_id')
                ->references('id')
                ->on('m_customer')
                ->onDelete('set null');

            $table->string('transaction_date',25);
            $table->string('account_code',15);
            
            $table->double('amount',12,2)->nullable()->default(0.00);
            $table->double('base_amount',12,2)->nullable()->default(0.00);
            $table->double('credit',12,2)->nullable()->default(0.00);
            $table->double('debit',12,2)->nullable()->default(0.00);

            $table->unsignedBigInteger('cr_detail_id')->nullable();
            $table->foreign('cr_detail_id')
                ->references('id')
                ->on('t_credit_note_customer_detail')
                ->onDelete('set null');

            $table->unsignedBigInteger('rv_detail_id')->nullable();
            $table->foreign('rv_detail_id')
                ->references('id')
                ->on('t_rv_detail')
                ->onDelete('set null');

            $table->unsignedBigInteger('rv_master_id')->nullable();
            $table->foreign('rv_master_id')
                ->references('id')
                ->on('t_rv_master')
                ->onDelete('set null');

            $table->unsignedBigInteger('invoice_id')->nullable();
            $table->foreign('invoice_id')
                ->references('id')
                ->on('t_invoice_master')
                ->onDelete('set null');

            $table->string('particulars',25);
            $table->string('ref_data', 25);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_account_customer_cn');
    }
};
