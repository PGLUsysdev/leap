<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Office extends Model
{
    /** @use HasFactory<\Database\Factories\OfficeFactory> */
    use HasFactory;

    protected $fillable = [
        'sector_id',
        'lgu_level_id',
        'office_type_id',
        'code',
        'name',
        'acronym',
        'is_lee',
    ];

    protected $appends = ['full_code'];

    protected function fullCode(): Attribute
    {
        return Attribute::make(
            get: fn() => sprintf(
                '%s-%s-%s-%s',
                $this->sector?->code ?? '0000',
                $this->lguLevel?->code ?? '0',
                $this->officeType?->code ?? '00',
                $this->code ?? '000',
            ),
        );
    }

    public function sector()
    {
        return $this->belongsTo(Sector::class, 'sector_id');
    }

    public function lguLevel()
    {
        return $this->belongsTo(LguLevel::class, 'lgu_level_id');
    }

    public function officeType()
    {
        return $this->belongsTo(OfficeType::class, 'office_type_id');
    }
}
