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
        Schema::create('t_grn_accounts_payable', function (Blueprint $table) {
            $table->id();

            $table->string('grn_no',30);
            $table->string('transaction_date',20);
            $table->string('account_code',20);
            $table->string('account_description',255);

            $table->unsignedBigInteger('product_id')->nullable();
            $table->foreign('product_id')
                ->references('id')
                ->on('m_products')
                ->onDelete('set null');

            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->foreign('supplier_id')
                ->references('id')
                ->on('m_suppliers')
                ->onDelete('set null');

            $table->unsignedBigInteger('pv_detail_id')->nullable();
            $table->foreign('pv_detail_id')
                ->references('id')
                ->on('t_pv_detail')
                ->onDelete('set null');

            $table->unsignedBigInteger('po_detail_id')->nullable();
            $table->foreign('po_detail_id')
                ->references('id')
                ->on('t_porder_detail')
                ->onDelete('set null');
                
            $table->string('currency',10);
            $table->double('amount',12,2)->nullable()->default(0.00);
            $table->double('base_amount',12,2)->nullable()->default(0.00);
            $table->double('debit',12,2)->nullable()->default(0.00);
            $table->double('credit',12,2)->nullable()->default(0.00);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_grn_accounts_payable');
    }
};
