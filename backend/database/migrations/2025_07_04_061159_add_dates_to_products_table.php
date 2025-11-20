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
            $table->string('created_date')->nullable();
            $table->string('release_date')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('m_products', function (Blueprint $table) {
            $table->string('created_date')->nullable();
            $table->string('release_date')->nullable();
        });
    }
};
