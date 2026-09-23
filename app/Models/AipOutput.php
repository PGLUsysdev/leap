<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AipOutput extends Model
{
    protected $fillable = [
        'aip_entry_id',
        'source_output_id',
        'expected_output',
        'start_date',
        'end_date',
        'sort_order',
    ];

    // Relationships
    public function aipEntry()
    {
        return $this->belongsTo(AipEntry::class);
    }

    /**
     * Lineage: the output this row was carried from (null = original).
     * Cumulative views group by the root source id.
     */
    public function sourceOutput()
    {
        return $this->belongsTo(AipOutput::class, 'source_output_id');
    }

    public function derivedOutputs()
    {
        return $this->hasMany(AipOutput::class, 'source_output_id');
    }

    /**
     * Stable merge key across documents: explicit lineage wins,
     * otherwise fall back to own id (treated as original).
     */
    public function rootSourceId(): int
    {
        return (int) ($this->source_output_id ?? $this->id);
    }

    public function offices()
    {
        return $this->belongsToMany(Office::class, 'aip_output_office')
            ->withTimestamps();
    }

    // Funding sources directly linked to this output
    public function fundingSources()
    {
        return $this->hasMany(PpaFundingSource::class, 'aip_output_id');
    }
}
