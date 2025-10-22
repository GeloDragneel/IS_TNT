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
        Schema::create('menu_data', function (Blueprint $table) {
            $table->id();
            $table->string('root_name');
            $table->string('label_en');
            $table->string('label_cn');
            $table->string('icon');
            $table->string('icon_name');
            $table->string('component');
            $table->string('component_name');
            $table->tinyInteger('is_deleted');

            // Nullable foreign key to 'employees' table
            $table->unsignedBigInteger('login_id')->nullable();
            $table->foreign('login_id')->references('id')->on('logins')->onDelete('set null');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('menu_data');
    }
};
