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
        Schema::create('m_access_rights', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('login_id')->nullable();
            $table->foreign('login_id')
                ->references('id')
                ->on('m_login')
                ->onDelete('set null');

            $table->unsignedBigInteger('menu_id')->nullable();
            $table->foreign('menu_id')
                ->references('id')
                ->on('m_menu_data')
                ->onDelete('set null');

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_access_rights');
    }
};
