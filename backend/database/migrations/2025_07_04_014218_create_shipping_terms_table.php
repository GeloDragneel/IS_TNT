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
        Schema::create('m_shipping_terms', function (Blueprint $table) {
            $table->id();
            $table->string('shipping_terms_en');
            $table->string('shipping_terms_cn');
            $table->tinyInteger('is_deleted');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_shipping_terms');
    }
};
