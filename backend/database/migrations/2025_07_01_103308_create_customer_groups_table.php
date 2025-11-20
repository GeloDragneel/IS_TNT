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
        Schema::create('m_customer_group', function (Blueprint $table) {
            $table->id();
            $table->string('customer_group_en');
            $table->string('customer_group_cn');
            $table->string('currency');
            $table->integer('brevo_list_id');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_customer_group');
    }
};
