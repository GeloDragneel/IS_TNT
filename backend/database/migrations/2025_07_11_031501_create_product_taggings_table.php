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
        Schema::create('m_product_tagging_master', function (Blueprint $table) {
            $table->id();

            $table->string('old_product_code',40);
            $table->string('product_code',40);
            $table->string('product_title_en',60);
            $table->string('product_title_cn',60);
            $table->tinyInteger('is_tnt')->default(0);
            $table->tinyInteger('is_wholesale')->default(0);
            $table->tinyInteger('is_activate_banner')->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_product_tagging_master');
    }
};
