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
        Schema::create('m_invoice_status', function (Blueprint $table) {
            $table->id();
            $table->string('status_value',40);
            $table->string('status_value_en',40);
            $table->string('status_value_cn',40);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_invoice_status');
    }
};
