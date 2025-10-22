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
        Schema::create('t_grn_master', function (Blueprint $table) {
            $table->id();
            $table->string('grn_no',25)->unique();

            $table->unsignedBigInteger('supplier_id')->nullable();
            $table->foreign('supplier_id')
                ->references('id')
                ->on('m_suppliers')
                ->onDelete('set null');

            $table->string('grn_date',15);

            $table->double('total',12,2)->nullable()->default(0.00)->default(0.00);
            $table->double('base_total',12,2)->nullable()->default(0.00)->default(0.00);
            $table->double('ex_rate',12,4)->nullable()->default(0.00)->default(0.00);
            $table->string('currency',5);
            $table->unsignedBigInteger('shipping_Stat_id')->nullable();
            $table->foreign('shipping_Stat_id')
                ->references(columns: 'id')
                ->on('m_shipping_stat')
                ->onDelete('set null');

            $table->unsignedBigInteger('shipper_id')->nullable();
            $table->foreign('shipper_id')
                ->references(columns: 'id')
                ->on('m_couriers')
                ->onDelete('set null');

            $table->unsignedBigInteger('company_id')->nullable();
            $table->foreign('company_id')
                ->references(columns: 'id')
                ->on('m_store_location')
                ->onDelete('set null');

            $table->unsignedBigInteger('grn_status_id')->nullable();
            $table->foreign('grn_status_id')
                ->references(columns: 'id')
                ->on('m_grn_status')
                ->onDelete('set null');

            $table->string('warehouse',15);
            $table->tinyInteger('imported');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_grn_master');
    }
};
