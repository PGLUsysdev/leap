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
        // 1. Fix Users Table: Change cascade to restrict
        Schema::table('users', function (Blueprint $table) {
            // Drop existing foreign key constraint
            // Laravel default name is usually 'users_office_id_foreign'
            $table->dropForeign(['office_id']);

            // Add it back with restrictOnDelete()
            $table
                ->foreign('office_id')
                ->references('id')
                ->on('offices')
                ->restrictOnDelete();
        });

        // 2. Fix Offices Table: Ensure parent_id is explicitly restricted
        Schema::table('offices', function (Blueprint $table) {
            // Drop existing foreign key constraint
            $table->dropForeign(['parent_id']);

            // Add it back with restrictOnDelete()
            $table
                ->foreign('parent_id')
                ->references('id')
                ->on('offices')
                ->restrictOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverting back to original states if needed
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['office_id']);
            $table
                ->foreign('office_id')
                ->references('id')
                ->on('offices')
                ->cascadeOnDelete();
        });

        Schema::table('offices', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->foreign('parent_id')->references('id')->on('offices'); // Default
        });
    }
};
