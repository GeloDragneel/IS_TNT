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
        Schema::table('m_price_setup', function (Blueprint $table) {
            Schema::rename('price_setups', 'm_price_setup');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_price_setup', function (Blueprint $table) {
            Schema::rename('price_setups', 'm_price_setup');
        });
    }
};
