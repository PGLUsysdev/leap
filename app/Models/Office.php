<?php

namespace App\Models;

use Database\Factories\OfficeFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Office extends Model
{
    /** @use HasFactory<OfficeFactory> */
    use HasFactory;

    /**
     * PGLU Space department codes, keyed by office id.
     *
     * Only offices with no parent carry one: sub-units are reached through
     * `parent_id` (SDU/DMU/IINMU/ASU under PICTO, AS/PS under BACSU), which is
     * how the API models them too. POPS and PHB have no upstream counterpart.
     *
     * Hardcoded because these are stable external identifiers, not data the
     * app edits. Upstream renumbering would break the personnel join silently,
     * so tests/Feature/PersonnelScheduleTest.php asserts the shape of this map.
     *
     * @see docs/pgluspace-data-exploration.md
     *
     * @var array<int, string>
     */
    public const DEPT_CODES = [
        1 => '1000',   // OPG
        2 => '1023',   // BACSU → OPG-BACSD
        3 => '1038',   // IASU → OPG-IASD
        4 => '1035',   // SSU → OPG-SSD
        6 => '1036',   // LUPJ → OPG-LUPJ
        7 => '1001',   // OVG → OPVG
        8 => '1002',   // OSP → SPO
        9 => '1004',   // PTO
        10 => '1005',  // OPAss → OPAssessor
        11 => '1006',  // OPAcc → OPAccountant
        12 => '1008',  // PBO
        13 => '1009',  // OPPDC → PPDC
        14 => '1010',  // PLO
        15 => '1011',  // OPAdmin
        16 => '1014',  // PGSO
        17 => '1021',  // PIO
        18 => '1022',  // PICTO
        19 => '1209',  // PHRMDO
        21 => '923',   // GAD → OPG-GAD
        22 => '126',   // PESO → OPG-PESD
        23 => '747',   // PYESDO
        24 => '1013',  // PSWDO
        25 => '1012',  // PHO
        26 => '1043',  // BDH → BAC DH
        27 => '1044',  // BalDH → BAL DH
        28 => '1045',  // CDH
        29 => '1046',  // NDH
        30 => '1047',  // RDH
        31 => '165',   // PCDO → OPG-PCD
        32 => '1007',  // PEO
        33 => '1015',  // OPAg → OPAG
        34 => '1016',  // OPVet
        35 => '1018',  // PG-ENRO → PGENRO
        36 => '1041',  // PDRRMO
        37 => '1040',  // LUPTO
        38 => '1031',  // LEEIPO → OPG-LEEIPO
    ];

    protected $fillable = [
        'sector_id',
        'lgu_level_id',
        'office_type_id',
        'parent_id',
        'code',
        'name',
        'acronym',
        'is_lee',
    ];

    protected $appends = ['full_code'];

    protected function fullCode(): Attribute
    {
        return Attribute::make(
            get: function () {
                $sectorCode = $this->sector?->code ?? '0000';
                $lguLevelCode = $this->lguLevel?->code ?? '0';
                $officeTypeCode = str_pad(
                    (string) ($this->officeType?->code ?? '00'),
                    2,
                    '0',
                    STR_PAD_LEFT,
                );
                $officeCode = str_pad(
                    (string) ($this->code ?? ''),
                    3,
                    '0',
                    STR_PAD_LEFT,
                );

                return sprintf(
                    '%s-%s-%s-%s',
                    $sectorCode,
                    $lguLevelCode,
                    $officeTypeCode,
                    $officeCode,
                );
            },
        );
    }

    /**
     * The PGLU Space department this office belongs to.
     *
     * Sub-units carry no code of their own, so this walks up `parent_id` to the
     * nearest ancestor that has one — the API reports every employee of, say,
     * PICTO under PICTO's code, with no separate unit to distinguish them.
     */
    public function deptCode(): ?string
    {
        for ($office = $this; $office !== null; $office = $office->parent) {
            if (isset(self::DEPT_CODES[$office->id])) {
                return self::DEPT_CODES[$office->id];
            }
        }

        return null;
    }

    /**
     * Reduce a set of offices to one per PGLU Space department.
     *
     * `deptCode()` walks up to the nearest ancestor carrying a department code, so a
     * sub-unit and its parent read the same employees. Anything summing personnel
     * across offices must count each department once, or sub-units are billed
     * twice. Offices with no department are dropped — they contribute nothing.
     *
     * @param  iterable<int, int>  $officeIds
     * @return array<int, int>
     */
    public static function onePerDepartment(iterable $officeIds): array
    {
        $byDepartment = [];

        foreach ($officeIds as $id) {
            $deptCode = self::find($id)?->load('parent')->deptCode();

            if ($deptCode !== null && ! isset($byDepartment[$deptCode])) {
                $byDepartment[$deptCode] = (int) $id;
            }
        }

        return array_values($byDepartment);
    }

    /**
     * Limit the query to the office mapped to a PGLU Space department code.
     */
    public function scopeForDeptCode(Builder $query, string $deptCode): Builder
    {
        $officeId = array_search($deptCode, self::DEPT_CODES, true);

        return $query->whereKey($officeId === false ? 0 : $officeId);
    }

    // hasMany
    public function children(): HasMany
    {
        return $this->hasMany(Office::class, 'parent_id');
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'office_id');
    }

    public function ppas(): HasMany
    {
        return $this->hasMany(Ppa::class, 'office_id');
    }

    public function aipDocuments(): HasMany
    {
        return $this->hasMany(AipDocument::class, 'office_id');
    }

    // belongsToMany
    public function aipOutputs(): BelongsToMany
    {
        return $this->belongsToMany(AipOutput::class, 'aip_output_office')
            ->withTimestamps();
    }

    // belongsTo
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Office::class, 'parent_id');
    }

    public function sector(): BelongsTo
    {
        return $this->belongsTo(Sector::class, 'sector_id');
    }

    public function lguLevel(): BelongsTo
    {
        return $this->belongsTo(LguLevel::class, 'lgu_level_id');
    }

    public function officeType(): BelongsTo
    {
        return $this->belongsTo(OfficeType::class, 'office_type_id');
    }
}
