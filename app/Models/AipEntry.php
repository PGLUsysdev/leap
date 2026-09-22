<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 */
class AipEntry extends Model
{
    use HasFactory;

    protected $fillable = ['ppa_id', 'aip_document_id'];

    // belongsTo
    public function ppa(): BelongsTo
    {
        return $this->belongsTo(Ppa::class, 'ppa_id');
    }

    public function aipDocument(): BelongsTo
    {
        return $this->belongsTo(AipDocument::class, 'aip_document_id');
    }

    // hasMany
    public function outputs(): HasMany
    {
        return $this->hasMany(AipOutput::class, 'aip_entry_id');
    }
}
