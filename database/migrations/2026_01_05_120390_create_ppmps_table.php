<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ppmps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('aip_entry_id')->constrained();
            $table->foreignId('ppmp_price_list_id')->nullable()->constrained();
            $table->foreignId('funding_source_id')->constrained();
            $table->decimal('jan_qty', 19, 2)->default(0);
            $table->decimal('jan_amount', 15, 2)->default(0);
            $table->decimal('feb_qty', 19, 2)->default(0);
            $table->decimal('feb_amount', 15, 2)->default(0);
            $table->decimal('mar_qty', 19, 2)->default(0);
            $table->decimal('mar_amount', 15, 2)->default(0);
            $table->decimal('apr_qty', 19, 2)->default(0);
            $table->decimal('apr_amount', 15, 2)->default(0);
            $table->decimal('may_qty', 19, 2)->default(0);
            $table->decimal('may_amount', 15, 2)->default(0);
            $table->decimal('jun_qty', 19, 2)->default(0);
            $table->decimal('jun_amount', 15, 2)->default(0);
            $table->decimal('jul_qty', 19, 2)->default(0);
            $table->decimal('jul_amount', 15, 2)->default(0);
            $table->decimal('aug_qty', 19, 2)->default(0);
            $table->decimal('aug_amount', 15, 2)->default(0);
            $table->decimal('sep_qty', 19, 2)->default(0);
            $table->decimal('sep_amount', 15, 2)->default(0);
            $table->decimal('oct_qty', 19, 2)->default(0);
            $table->decimal('oct_amount', 15, 2)->default(0);
            $table->decimal('nov_qty', 19, 2)->default(0);
            $table->decimal('nov_amount', 15, 2)->default(0);
            $table->decimal('dec_qty', 19, 2)->default(0);
            $table->decimal('dec_amount', 15, 2)->default(0);

            $table->timestamps();

            $table->unique([
                'aip_entry_id',
                'ppmp_price_list_id',
                'funding_source_id',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('unified_ppmp_items');
    }
};
