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
        Schema::create('t_credit_note_supplier_master', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->foreign('supplier_id')
                ->references('id')
                ->on('m_suppliers')
                ->onDelete('set null');

            $table->string('cr_number',25)->unique();
            $table->string('cr_date',25);

            $table->unsignedBigInteger('cr_status_id')->nullable();
            $table->foreign('cr_status_id')
                ->references('id')
                ->on('m_invoice_status')
                ->onDelete('set null');

            $table->string('currency',10)->nullable();
            $table->double('ex_rate',12,4)->nullable()->default(0.0000);

            $table->double('amount',12,2)->nullable()->default(0.00);
            $table->double('base_amount',12,2)->nullable()->default(0.00);

            $table->string('remarks_en',255)->nullable();
            $table->string('remarks_cn',255)->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_credit_note_supplier_master');
    }
};
