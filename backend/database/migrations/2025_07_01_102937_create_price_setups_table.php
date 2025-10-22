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
        Schema::create('price_setups', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('customer_group_id');
            $table->enum('type', ['retail', 'wholesale']);
            $table->string('currency');
            $table->integer('pcs_or_crtn');
            $table->double('deposit',10,2);
            $table->double('price_a',10,2);
            $table->double('price_b',10,2)->nullable()->default(0.00);
            $table->double('price_c',10,2)->nullable()->default(0.00);
            $table->double('retail_price',10,2)->nullable()->default(0.00);
            $table->double('preorder_price',10,2)->nullable()->default(0.00);

            $table->integer(column: 'profit_prcnt_a')->nullable()->default(0);
            $table->integer(column: 'profit_prcnt_b')->nullable()->default(0);
            $table->integer(column: 'profit_prcnt_c')->nullable()->default(0);

            $table->integer('price_a_pcs_crtn')->nullable()->default(0);
            $table->integer('price_b_pcs_crtn')->nullable()->default(0);
            $table->integer('price_c_pcs_crtn')->nullable()->default(0);

            $table->integer('price_b_to_pcs_crtn')->nullable()->default(0);
            $table->integer('price_c_to_pcs_crtn')->nullable()->default(0);


            $table->foreign('product_id')->references('id')->on('m_products')->onDelete('cascade');
            $table->foreign('customer_group_id')->references('id')->on('m_customer_group')->onDelete('cascade');
        
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('price_setups');
    }
};
