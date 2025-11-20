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
        Schema::create('m_charts_of_account', function (Blueprint $table) {
            $table->id();
            $table->string('root_name',15);
            $table->string('account_code',15);
            $table->string('account_name_en',50);
            $table->string('account_name_cn',50);
            $table->string('account_type_en',50);
            $table->string('account_type_cn',50);
            $table->string('description_en',50);
            $table->string('description_cn',50);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_charts_of_account');
    }
};
