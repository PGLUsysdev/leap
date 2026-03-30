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
        Schema::create('ppas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('office_id')->constrained();

            // Self-referencing parent
            $table
                ->foreignId('parent_id')
                ->nullable()
                ->constrained('ppas')
                ->onDelete('cascade');

            $table->string('name');
            $table->enum('type', [
                'Program',
                'Project',
                'Activity',
                'Sub-Activity',
            ]);
            $table->string('code_suffix', 4);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Prevent duplicate suffixes for the same office/parent
            $table->unique(
                ['office_id', 'parent_id', 'code_suffix', 'type'],
                'ppa_unique_index',
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ppas');
    }
};
