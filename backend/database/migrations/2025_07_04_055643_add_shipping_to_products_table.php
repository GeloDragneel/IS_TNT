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
        Schema::table('m_products', function (Blueprint $table) {
            $table->string('shipping_currency')->nullable();
            $table->double('shipping_cost', 10, 2)->nullable()->default(0.00);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_products', function (Blueprint $table) {
            $table->string('shipping_currency')->nullable();
            $table->double('shipping_cost', 10, 2)->nullable()->default(0.00);
        });
    }
};
