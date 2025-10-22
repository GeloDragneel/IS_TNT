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
        Schema::create('t_porder_masters', function (Blueprint $table) {
            $table->id();

            $table->string('po_number',25)->unique();
            $table->string('po_date',20);
            $table->string('currency',5);
            $table->double('ex_rate',12,4)->nullable()->default(0.00)->default(0.0000);
            $table->double('po_amount',12,2)->nullable()->default(0.00)->default(0.00);
            $table->double('base_currency',12,2)->nullable()->default(0.00)->default(0.00);
            $table->double('deposit',12,2)->nullable()->default(0.00);
            $table->double('base_deposit',12,2)->nullable()->default(0.00);
            $table->double('bank_charges',12,2)->nullable()->default(0.00);
            $table->double('base_bank_charges',12,2)->nullable()->default(0.00);
            $table->string('bank',15)->nullable();

            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->foreign('supplier_id')
                ->references('id')
                ->on('m_suppliers')
                ->onDelete('set null');

            $table->unsignedBigInteger('procurement_by_id')->nullable();
            $table->foreign('procurement_by_id')
                ->references('id')
                ->on('m_store_location')
                ->onDelete('set null');

            $table->unsignedBigInteger('postatus_id')->nullable();
            $table->foreign('postatus_id')
                ->references(columns: 'id')
                ->on('m_postatus')
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

            $table->string('due_date',20)->nullable();
            $table->string('ship_to',20)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_porder_masters');
    }
};
