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
            $table->tinyInteger(column: 'is_active_banner')->nullable();  // Add a new column
            $table->string(column: 'is_active_banner_latest_date')->nullable();  // Add a new column
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_products', function (Blueprint $table) {
            $table->tinyInteger(column: 'is_active_banner')->nullable();  // Add a new column
            $table->string(column: 'is_active_banner_latest_date')->nullable();  // Add a new column
        });
    }
};
