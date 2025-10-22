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
        Schema::table('m_manufacturer', function (Blueprint $table) {
            Schema::rename('manufacturer', 'm_manufacturer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_manufacturer', function (Blueprint $table) {
            Schema::rename('manufacturer', 'm_manufacturer');
        });
    }
};
