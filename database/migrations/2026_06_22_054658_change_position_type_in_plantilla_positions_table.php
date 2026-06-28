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
        Schema::table('plantilla_positions', function (Blueprint $table) {
            // New structure: swaps 'coterminous' for 'temporary'
            $table
                ->enum('position_type', [
                    'permanent',
                    'casual',
                    'contractual',
                    'temporary',
                ])
                ->default('permanent')
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plantilla_positions', function (Blueprint $table) {
            $table
                ->enum('position_type', [
                    'permanent',
                    'casual',
                    'contractual',
                    'coterminous',
                ])
                ->default('permanent')
                ->change();
        });
    }
};
