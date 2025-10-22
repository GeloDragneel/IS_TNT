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
        Schema::create('t_ap_master', function (Blueprint $table) {
            $table->id();

            $table->string('ap_number',25)->unique();
            $table->string('ap_date',25);

            $table->string('currency',10)->nullable();
            $table->double('ex_rate',12,4)->nullable()->default(0.0000);

            $table->double('tax',12,2)->nullable()->default(0.00);
            $table->double('bae_tax',12,2)->nullable()->default(0.00);
            
            $table->double('sub_total',12,2)->nullable()->default(0.00);
            $table->double('base_sub_total',12,2)->nullable()->default(0.00);

            $table->double('total',12,2)->nullable()->default(0.00);
            $table->double('base_total',12,2)->nullable()->default(0.00);
            $table->double('payment',12,2)->nullable()->default(0.00);
            $table->double('balance',12,2)->nullable()->default(0.00);
            $table->double('deposit',12,2)->nullable()->default(0.00);
            $table->double('base_deposit',12,2)->nullable()->default(0.00);
            $table->double('po_ex_rate',12,4)->nullable()->default(0.0000);
            $table->double('grn_ex_rate',12,4)->nullable()->default(0.0000);
            $table->double('po_adv_pay',12,2)->nullable()->default(0.00);
            $table->double('grn_base_total',12,2)->nullable()->default(0.00);
            $table->double('credit_used',12,2)->nullable()->default(0.00);
            $table->double('base_credit_used',12,2)->nullable()->default(0.00);
            $table->double('current_credit',12,2)->nullable()->default(0.00);
            $table->double('base_current_credit',12,2)->nullable()->default(0.00);
            $table->double('total_deduction',12,2)->nullable()->default(0.00);
            $table->double('base_total_deduction',12,2)->nullable()->default(0.00);

            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->foreign('supplier_id')
                ->references('id')
                ->on('m_suppliers')
                ->onDelete('set null');

            $table->unsignedBigInteger('invoice_status_id')->nullable();
            $table->foreign('invoice_status_id')
                ->references('id')
                ->on('m_invoice_status')
                ->onDelete('set null');

            $table->unsignedBigInteger('ship_to_id')->nullable();
            $table->foreign('ship_to_id')
                ->references('id')
                ->on('m_couriers')
                ->onDelete('set null');

            $table->unsignedBigInteger('bill_to_id')->nullable();
            $table->foreign('bill_to_id')
                ->references('id')
                ->on('m_store_location`')
                ->onDelete('set null');

            $table->unsignedBigInteger('payment_terms_id')->nullable();
            $table->foreign('payment_terms_id')
                ->references(columns: 'id')
                ->on('m_payment_terms')
                ->onDelete('set null');

            $table->unsignedBigInteger('delivery_method_id')->nullable();
            $table->foreign('delivery_method_id')
                ->references(columns: 'id')
                ->on('m_couriers')
                ->onDelete('set null');

            $table->unsignedBigInteger('shipping_terms_id')->nullable();
            $table->foreign('shipping_terms_id')
                ->references(columns: 'id')
                ->on('m_shipping_terms')
                ->onDelete('set null');

            $table->string('bank',25);
            $table->string('due_date',25);
            $table->string('delivery_date',25);
            $table->string('tax_group',10);
            $table->string('remarks',255);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_ap_master');
    }
};
