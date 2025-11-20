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
        Schema::create('m_product_tagging_detail', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('product_tagging_master_id')->nullable();
            $table->foreign('product_tagging_master_id')
                ->references('id')
                ->on('m_product_tagging_master')
                ->onDelete('set null');
                
            $table->unsignedBigInteger('product_id')->nullable();
            $table->foreign('product_id')
                ->references('id')
                ->on('m_products')
                ->onDelete('set null');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_product_tagging_detail');
    }
};
