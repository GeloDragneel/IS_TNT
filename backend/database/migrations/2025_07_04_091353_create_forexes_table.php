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
        Schema::create('m_forex', function (Blueprint $table) {
            $table->id();
            $table->string('from_currency', 10); // VARCHAR(10)
            $table->string('to_currency', 10); // VARCHAR(10)
            $table->double('ex_rate', 10,4); // VARCHAR(10)
            $table->string('date_enter', 15); // VARCHAR(10)
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_forex');
    }
};
