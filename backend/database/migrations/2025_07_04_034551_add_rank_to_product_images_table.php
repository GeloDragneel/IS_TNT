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
        Schema::table('m_product_images', function (Blueprint $table) {
            $table->string('rank'); // 👈 your new column
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_product_images', function (Blueprint $table) {
            $table->string('rank'); // 👈 your new column
        });
    }
};
