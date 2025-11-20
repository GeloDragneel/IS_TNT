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
        Schema::create('t_inventory_tblmaster', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('product_id')->nullable();
            $table->foreign('product_id')
                ->references(columns: 'id')
                ->on('m_products')
                ->onDelete('set null');

            $table->integer('qty');
            $table->integer('allocated_qty');
            $table->string('warehouse','15');
            $table->tinyInteger('from_grn')->default(0);
            $table->integer('physical_qty')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_inventory_tblmaster');
    }
};
