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
        Schema::create('t_rv_master_invoices', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('rv_master_id')->nullable();
            $table->foreign('rv_master_id')
                ->references('id')
                ->on('t_rv_master')
                ->onDelete('set null');

            $table->unsignedBigInteger('invoice_master_id')->nullable();
            $table->foreign('invoice_master_id')
                ->references('id')
                ->on('t_invoice_master')
                ->onDelete('set null');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_rv_master_invoices');
    }
};
