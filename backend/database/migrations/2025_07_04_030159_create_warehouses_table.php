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
        Schema::create('m_warehouse', function (Blueprint $table) {
            $table->id();
            $table->string('wh_code')->nullable();
            $table->string('warehouse_en')->nullable();
            $table->string('warehouse_cn')->nullable();
            $table->string('country_code')->nullable();
            $table->string('currency')->nullable();
            $table->tinyInteger('is_deleted')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_warehouse');
    }
};
