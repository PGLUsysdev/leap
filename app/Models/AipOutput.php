<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AipOutput extends Model
{
    protected $fillable = [
        'aip_entry_id',
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
