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
        Schema::create('m_store_location', function (Blueprint $table) {
            $table->id();
            $table->string( 'store_name_en',50)->nullable();
            $table->string( 'store_name_cn',50)->nullable();
            $table->string( 'address_en',255)->nullable();
            $table->string( 'address_cn',255)->nullable();
            $table->tinyInteger('set_as_default')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_store_location');
    }
};
