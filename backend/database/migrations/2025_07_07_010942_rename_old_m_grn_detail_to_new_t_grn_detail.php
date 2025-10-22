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
        Schema::table('t_grn_detail', function (Blueprint $table) {
            Schema::rename('m_grn_detail', 't_grn_detail');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('t_grn_detail', function (Blueprint $table) {
            Schema::rename('m_grn_detail', 't_grn_detail');
        });
    }
};
