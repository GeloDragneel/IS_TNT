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
        Schema::create('m_suppliers', function (Blueprint $table) {
            $table->id();

            $table->string('supplier_code');
            $table->string('old_supplier_code');
            $table->string('suppliername_en')->nullable();
            $table->string('suppliername_cn')->nullable();
            $table->string('contact_person_en')->nullable();
            $table->string('contact_person_cn')->nullable();
            $table->longText('supplier_address_en')->nullable();
            $table->longText('supplier_address_cn')->nullable();
            $table->string('contact_number')->nullable();
            $table->string('country')->nullable();
            $table->integer('country_state')->nullable()->default(0);
            $table->string('postal_code')->nullable();
            $table->string('fax')->nullable();
            $table->string('email')->nullable();
            $table->string('bank_name_en')->nullable();
            $table->string('bank_name_cn')->nullable();
            $table->string('bank_account_name_en')->nullable();
            $table->string('bank_account_name_cn')->nullable();
            $table->string('bank_account_no')->nullable();
            $table->string('bank_address_en')->nullable();
            $table->string('bank_address_cn')->nullable();
            $table->string('bank_country')->nullable();
            $table->integer('bank_country_state')->nullable()->default(0);
            $table->string('bank_tel_no')->nullable();
            $table->string('bank_swift_code')->nullable();
            $table->string('bank_postal_code_2')->nullable();
            $table->string('currency')->nullable();
            $table->string('iban')->nullable();
            $table->string('tax')->nullable();

            $table->unsignedBigInteger('payment_terms_id')->nullable();
            $table->foreign('payment_terms_id')
                ->references('id')
                ->on('m_payment_terms')
                ->onDelete('set null');


            $table->unsignedBigInteger('shipping_terms_id')->nullable();
            $table->foreign('shipping_terms_id')
                ->references('id')
                ->on('m_shipping_terms')
                ->onDelete('set null');

            $table->unsignedBigInteger('delivery_method_id')->nullable();
            $table->foreign('delivery_method_id')
                ->references('id')
                ->on('m_courier')
                ->onDelete('set null');

            $table->tinyInteger('is_deleted');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_suppliers');
    }
};
