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
        Schema::create('t_so_master', function (Blueprint $table) {
            $table->id();

            $table->string('so_number',25)->unique();
            $table->string('invoice_no',25);
            $table->string('so_date',25);

            $table->unsignedBigInteger('customer_id')->nullable();
            $table->foreign('customer_id')
                ->references('id')
                ->on('m_customer')
                ->onDelete('set null');

            $table->string('invoice_type',10)->nullable();

            $table->unsignedBigInteger('shipping_stat_id')->nullable();
            $table->foreign('shipping_stat_id')
                ->references('id')
                ->on('m_shipping_stat')
                ->onDelete('set null');

            $table->unsignedBigInteger('payment_terms_id')->nullable();
            $table->foreign('payment_terms_id')
                ->references('id')
                ->on('m_payment_terms')
                ->onDelete('set null');

            $table->unsignedBigInteger('sales_person_id')->nullable();
            $table->foreign('sales_person_id')
                ->references('id')
                ->on('m_employee_info')
                ->onDelete('set null');

            $table->unsignedBigInteger('invoice_status_id')->nullable();
            $table->foreign('invoice_status_id')
                ->references('id')
                ->on('m_invoice_status')
                ->onDelete('set null');

            $table->string('currency',10)->nullable();
            $table->double('ex_rate',12,4)->nullable()->default(0.0000);

            $table->double('total',12,2)->nullable()->default(0.00);
            $table->double('base_total',12,2)->nullable()->default(0.00);
            
            $table->double('sub_total',12,2)->nullable()->default(0.00);
            $table->double('base_sub_total',12,2)->nullable()->default(0.00);

            $table->double('total_deposit',12,2)->nullable()->default(0.00);
            $table->double('base_total_deposit',12,2)->nullable()->default(0.00);
            
            $table->double('total_to_pay',12,2)->nullable()->default(0.00);
            $table->double('base_total_to_pay',12,2)->nullable()->default(0.00);

            $table->double('total_deduction',12,2)->nullable()->default(0.00);
            $table->double('base_total_deduction',12,2)->nullable()->default(0.00);

            $table->double('payment',12,2)->nullable()->default(0.00);

            $table->double('current_credit',12,2)->nullable()->default(0.00);
            $table->double('base_current_credit',12,2)->nullable()->default(0.00);
            
            $table->double('credit_used',12,2)->nullable()->default(0.00);
            $table->double('base_credit_used',12,2)->nullable()->default(0.00);
            
            $table->double('cr_amount',12,2)->nullable()->default(0.00);
            $table->double('base_cr_amount',12,2)->nullable()->default(0.00);
            
            $table->double('adv_amount',12,2)->nullable()->default(0.00);
            $table->double('base_adv_amount',12,2)->nullable()->default(0.00);
            
            $table->double('excess_amount',12,2)->nullable()->default(0.00);
            $table->double('base_excess_amount',12,2)->nullable()->default(0.00);
            
            $table->double('voucher_amount',12,2)->nullable()->default(0.00);
            $table->double('base_voucher_amount',12,2)->nullable()->default(0.00);

            $table->double('sub_total_on_cost',12,2)->nullable()->default(0.00);

            $table->string('due_date',25);
            $table->string('delivery_date',25);
            $table->string('tax',10);

            $table->double('tax_amount',12,2)->nullable()->default(0.00);
            $table->double('base_tax_amount',12,2)->nullable()->default(0.00);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_so_master');
    }
};
