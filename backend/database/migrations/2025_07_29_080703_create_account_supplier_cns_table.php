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
        Schema::create('t_account_supplier_cn', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->foreign('supplier_id')
                ->references('id')
                ->on('m_suppliers')
                ->onDelete('set null');

            $table->unsignedBigInteger('cr_detail_id')->nullable();
            $table->foreign('cr_detail_id')
                ->references('id')
                ->on('t_credit_note_customer_detail')
                ->onDelete('set null');

            $table->unsignedBigInteger('pv_detail_id')->nullable();
            $table->foreign('pv_detail_id')
                ->references('id')
                ->on('t_pv_detail')
                ->onDelete('set null');

            $table->string('transaction_date',25)->nullable();
            $table->string('account_code',10)->nullable();
            $table->string('cr_number',10)->nullable();
            $table->string('pv_number',25)->nullable();
            $table->string('ap_invoice_no',25)->nullable();
            $table->string('ref_data',255)->nullable();

            $table->double('ex_rate',12,4)->default(0.0000);
            $table->string('currency',10)->nullable();

            $table->double('amount',12,2)->nullable()->default(0.00);
            $table->double('base_amount',12,2)->nullable()->default(0.00);
            $table->double('debit',12,2)->nullable()->default(0.00);
            $table->double('credit',12,2)->nullable()->default(0.00);

            $table->string('particulars',255)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_account_supplier_cn');
    }
};
