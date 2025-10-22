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
        Schema::create('t_pv_master', function (Blueprint $table) {
            $table->id();

            $table->string('pv_number',25)->unique();
            $table->string('pv_date',25);

            $table->string('pay_to_en',100)->nullable();
            $table->string('pay_to_cn',100)->nullable();

            $table->string('particular_en',100)->nullable();
            $table->string('particular_cn',100)->nullable();

            $table->string('currency',10)->nullable();
            $table->double('ex_rate',12,4)->nullable()->default(0.0000);

            $table->double('total_amount',12,2)->nullable()->default(0.00);
            $table->double('base_total_amount',12,2)->nullable()->default(0.00);
            $table->double('sub_total',12,2)->nullable()->default(0.00);
            $table->double('base_sub_total',12,2)->nullable()->default(0.00);
            $table->double('tax_amount',12,2)->nullable()->default(0.00);
            $table->double('base_tax_amount',12,2)->nullable()->default(0.00);

            $table->double('bank_charges',12,2)->nullable()->default(0.00);
            $table->double('base_bank_charges',12,2)->nullable()->default(0.00);
            $table->double('credit_used',12,2)->nullable()->default(0.00);
            $table->double('deposits',12,2)->nullable()->default(0.00);

            $table->string('tax_group',10)->nullable();
            $table->string('bank',10)->nullable();

            $table->unsignedBigInteger('customer_id')->nullable();
            $table->foreign('customer_id')
                ->references('id')
                ->on('m_customer')
                ->onDelete('set null');

            $table->unsignedBigInteger('pv_status_id')->nullable();
            $table->foreign('pv_status_id')
                ->references('id')
                ->on('m_invoice_status')
                ->onDelete('set null');


            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->foreign('supplier_id')
                ->references('id')
                ->on('m_suppliers')
                ->onDelete('set null');

            $table->unsignedBigInteger('payment_type_id')->nullable();
            $table->foreign('payment_type_id')
                ->references('id')
                ->on('m_payment_type')
                ->onDelete('set null');

            $table->string('ref_data',255)->nullable();
            $table->string('invoice_no',255)->nullable();
            $table->string('chart_fix_code',20)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
    */
    public function down(): void
    {
        Schema::dropIfExists('t_pv_master');
    }
};
