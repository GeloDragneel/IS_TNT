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
        Schema::create('m_customer', function (Blueprint $table) {
            $table->id();
            $table->string('customer_code',30);
            $table->string('old_customer_code',30);

            $table->string('account_name_en',50)->nullable();
            $table->string('account_name_cn',50)->nullable();

            $table->string('billing_address_en',255)->nullable()->default(''  );
            $table->string('billing_address_cn',255)->nullable()->default(''  );
            $table->string('billing_name_en',50)->nullable();
            $table->string('billing_name_cn',50)->nullable();
            $table->string('billing_postal_code',15)->nullable();
            $table->string('billing_country',10)->nullable();
            $table->unsignedBigInteger('billing_state_id')->nullable();
            $table->foreign('billing_state_id')
                ->references('id')
                ->on('m_states')
                ->onDelete('set null');
            $table->string('billing_tel_no',20)->nullable()->default(''  );
            $table->string('billing_fax_no',20)->nullable()->default(''  );

            $table->string('delivery_address_en',255)->nullable()->default(''  );
            $table->string('delivery_address_cn',255)->nullable()->default(''  );
            $table->string('delivery_name_en',50)->nullable()->default(''  );
            $table->string('delivery_name_cn',50)->nullable()->default(''  );
            $table->string('delivery_postal_code',15)->nullable()->default(''  );
            $table->string('delivery_country',10)->nullable()->default(''  );
            $table->unsignedBigInteger('delivery_state_id')->nullable();
            $table->foreign('delivery_state_id')
                ->references('id')
                ->on('m_states')
                ->onDelete('set null');
            $table->string('delivery_tel_no',25)->nullable()->default(''  );
            $table->string('delivery_fax_no',25)->nullable()->default(''  );


            $table->string('country',10)->nullable()->default(''  );
            $table->string('company_en',50)->nullable()->default(''  );
            $table->string('company_cn',50)->nullable()->default(''  );

            $table->string('email_address',35)->nullable()->default(''  );
            $table->string('webpage_address',35)->nullable()->default(''  );
            $table->tinyInteger('status')->nullable()->default(0  );
            $table->string('customer_since',15)->nullable()->default(''  );
            $table->string('currency',5)->nullable()->default(''  );
            $table->string('memo',255)->nullable()->default(''  );
            $table->string('shipping_address',255)->nullable()->default(''  );
            $table->double('credit_limit',10,2)->nullable()->default(0.00 );
            $table->string('price_level',25)->nullable()->default(''  );

            $table->unsignedBigInteger('sales_person_id')->nullable();
            $table->foreign('sales_person_id')
                ->references('id')
                ->on('m_employee_info')
                ->onDelete('set null');

            $table->unsignedBigInteger('payment_terms_id')->nullable();
            $table->foreign('payment_terms_id')
                ->references('id')
                ->on('m_payment_terms')
                ->onDelete('set null');

            $table->unsignedBigInteger('preferred_shipping_id')->nullable();
            $table->foreign('preferred_shipping_id')
                ->references('id')
                ->on('m_couriers')
                ->onDelete('set null');

            $table->unsignedBigInteger('shipping_terms_id')->nullable();
            $table->foreign('shipping_terms_id')
                ->references('id')
                ->on('m_shipping_terms')
                ->onDelete('set null');

            $table->unsignedBigInteger('source_id')->nullable();
            $table->foreign('source_id')
                ->references('id')
                ->on('m_source')
                ->onDelete('set null');

            $table->string('user_id',40)->nullable()->default(''  );

            $table->string('tax_ref_no',25)->nullable()->default(''  );
            $table->string('tax_group',10)->nullable()->default(''  );
            $table->string('mobile',25)->nullable()->default(''  );
            $table->string('password',25)->nullable()->default(''  );
            $table->string('tel_no',25)->nullable()->default(''  );
            $table->string('customer_type',5)->nullable()->default(''  );
            $table->string('pod',10)->nullable()->default(''  );
            $table->string('rwarehouse',10)->nullable()->default(''  );
            $table->string('language',5)->nullable()->default(''  );

            $table->tinyInteger('is_view_new_order')->nullable()->default(0 );
            $table->tinyInteger('is_subscribe')->nullable()->default(1 );
            $table->tinyInteger('is_new_inventory')->nullable()->default(0 );

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_customer');
    }
};
