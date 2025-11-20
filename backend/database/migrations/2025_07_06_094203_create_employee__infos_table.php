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
        Schema::create('m_employee_info', function (Blueprint $table) {
            $table->id();
            $table->string('employee_no',25);
            $table->string('firstname',50)->nullable();
            $table->string('middlename',length: 50)->nullable();
            $table->string('lastname',50)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_employee_info');
    }
};
