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
        Schema::create('m_shipping_stat', function (Blueprint $table) {
            $table->id();
            $table->string('shipping_stat_en',40);
            $table->string('shipping_stat_cn',40);
            $table->string('country_code',5)->nullable();
            $table->string('warehouse',10)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_shipping_stat');
    }
};
