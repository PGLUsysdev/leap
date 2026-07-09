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
        // 1. Create Climate Change Strategic Priorities Table
        Schema::create('cc_strategic_priorities', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('code')->unique(); // Stores JMC Priority Code (1 through 8)
            $table->string('name', 150);
            $table->timestamps();
        });

        // 2. Create Climate Change Sub-Sectors Table (depends on cc_strategic_priorities)
        Schema::create('cc_sub_sectors', function (Blueprint $table) {
            $table->id();
            $table
                ->foreignId('strategic_priority_id')
                ->constrained('cc_strategic_priorities')
                ->restrictOnDelete();
            $table->unsignedInteger('code'); // Stores Sector Code (e.g., 1 for Agriculture, 2 for Fisheries)
            $table->string('name', 150);

            // Unique constraint to ensure no duplicate sector codes under the same priority
            $table->unique(['strategic_priority_id', 'code']);
            $table->timestamps();
        });

        // 3. Create Climate Change Typologies Table (using category ENUM)
        Schema::create('cc_typologies', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique(); // Stores complete Typology Code, e.g., 'A114-01'
            $table->text('description');

            // A = Adaptation, M = Mitigation
            $table->enum('response_type', ['A', 'M']);

            $table
                ->foreignId('strategic_priority_id')
                ->constrained('cc_strategic_priorities')
                ->restrictOnDelete();
            $table
                ->foreignId('sub_sector_id')
                ->nullable()
                ->constrained('cc_sub_sectors')
                ->restrictOnDelete();

            // 1 = Policy Development and Governance, 2 = Research, Development and Extension, 3 = Knowledge Sharing and Capacity Building, 4 = Service Delivery
            $table->enum('category_code', ['1', '2', '3', '4']);

            $table->unsignedInteger('item_num'); // The serial/item number after the dash (e.g., 1, 2)
            $table->boolean('is_nccap_activity')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cc_typologies');
        Schema::dropIfExists('cc_sub_sectors');
        Schema::dropIfExists('cc_strategic_priorities');
    }
};
