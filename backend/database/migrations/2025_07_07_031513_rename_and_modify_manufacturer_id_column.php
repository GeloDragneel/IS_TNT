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
        // Drop foreign key constraints before altering columns
        Schema::table('m_products', function (Blueprint $table) {
            $table->dropForeign(['menufacturer_id']);
            $table->dropForeign(['product_type_id']);
            $table->dropForeign(['series_id']);
            $table->dropForeign(['brand_id']);
        });

        // Rename the column using raw SQL (for MariaDB/MySQL compatibility)
        DB::statement('ALTER TABLE m_products CHANGE menufacturer_id manufacturer_id BIGINT UNSIGNED NULL');

        // Modify other columns to be nullable
        Schema::table('m_products', function (Blueprint $table) {
            $table->unsignedBigInteger('product_type_id')->nullable()->change();
            $table->unsignedBigInteger('series_id')->nullable()->change();
            $table->unsignedBigInteger('brand_id')->nullable()->change();
        });

        // Re-add foreign key constraints
        Schema::table('m_products', function (Blueprint $table) {
            $table->foreign('manufacturer_id')->references('id')->on('m_manufacturer')->onDelete('cascade');
            $table->foreign('product_type_id')->references('id')->on('m_product_type')->onDelete('cascade');
            $table->foreign('series_id')->references('id')->on('m_series')->onDelete('cascade');
            $table->foreign('brand_id')->references('id')->on('m_brands')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop foreign keys
        Schema::table('m_products', function (Blueprint $table) {
            $table->dropForeign(['manufacturer_id']);
            $table->dropForeign(['product_type_id']);
            $table->dropForeign(['series_id']);
            $table->dropForeign(['brand_id']);
        });

        // Rename column back using raw SQL
        DB::statement('ALTER TABLE m_products CHANGE manufacturer_id menufacturer_id BIGINT UNSIGNED NOT NULL');

        // Make columns NOT NULL again (optional: adjust based on previous state)
        Schema::table('m_products', function (Blueprint $table) {
            $table->unsignedBigInteger('product_type_id')->nullable(false)->change();
            $table->unsignedBigInteger('series_id')->nullable(false)->change();
            $table->unsignedBigInteger('brand_id')->nullable(false)->change();
        });

        // Re-add original foreign keys
        Schema::table('m_products', function (Blueprint $table) {
            $table->foreign('menufacturer_id')->references('id')->on('m_manufacturer')->onDelete('cascade');
            $table->foreign('product_type_id')->references('id')->on('m_product_type')->onDelete('cascade');
            $table->foreign('series_id')->references('id')->on('m_series')->onDelete('cascade');
            $table->foreign('brand_id')->references('id')->on('m_brands')->onDelete('cascade');
        });
    }
};
