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
        Schema::create('m_countries', function (Blueprint $table) {
            $table->id();
            $table->string('country_en');
            $table->string('country_cn');
            $table->string('country_code');
            $table->string('iso3');
            $table->string('phone_code');
            $table->string('capital');
            $table->string('currency');
            $table->string('region');
            $table->string('sub_region');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_countries');
    }
};
