<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Ppa extends Model
{
    /** @use HasFactory<\Database\Factories\PpaFactory> */
    use HasFactory;

    protected $fillable = [
        'office_id',
        'parent_id',
        'name',
        'type',
        'code_suffix',
        'is_active',
        'sort_order',
    ];

    protected $appends = ['full_code'];

    protected function fullCode(): Attribute
    {
        return Attribute::make(
            get: function () {
                $suffix = $this->code_suffix ?? '0000';

                // 1. If this PPA has a parent, get the parent's full code first
                if ($this->parent_id) {
                    // Use the loaded relation if available to prevent N+1 queries
                    $parent = $this->relationLoaded('parent')
                        ? $this->parent
                        : $this->parent()->first();

                    if ($parent) {
                        return $parent->full_code . '-' . $suffix;
                    }
                }

                // 2. If no parent, we are at the top level (Program).
                // We start with the Office Code.
                $office = $this->relationLoaded('office')
                    ? $this->office
                    : $this->office()->first();
                $officePrefix = $office?->full_code ?? '0000-0-00-000';

                return $officePrefix . '-' . $suffix;
            },
        );
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Ppa::class, 'parent_id');
    }

    public function ancestor()
    {
        return $this->parent()->with('ancestor');
    }

    public function children()
    {
        return $this->hasMany(Ppa::class, 'parent_id');
    }

    public function aipEntries()
    {
        return $this->hasMany(AipEntry::class, 'ppa_id');
    }

    public function office()
    {
        return $this->belongsTo(Office::class);
    }
}
