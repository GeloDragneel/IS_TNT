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
        Schema::create('m_payment_terms', function (Blueprint $table) {
            $table->id();
            $table->string('alias');
            $table->string('payment_terms_en');
            $table->string('payment_terms_cn');
            $table->string('terms');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_payment_terms');
    }
};
