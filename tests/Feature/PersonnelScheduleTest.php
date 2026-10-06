<?php

use App\Models\Office;
use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config([
        'services.workspace.token' => 'pdapi_test_token',
        'services.workspace.base_url' => 'https://api.example.test/api/data/v1',
        // The Vite dev server answers the SSR endpoint on a page render, which
        // is not the request under test.
        'inertia.ssr.enabled' => false,
    ]);

    Http::preventStrayRequests();
});

/**
 * Offices are created with explicit ids because Office::DEPT_CODES is keyed by
 * them — the mapping is the point of these tests.
 */
function scheduleOffice(int $id, ?int $parentId = null): Office
{
    return Office::factory()->create([
        'id' => $id,
        'parent_id' => $parentId,
        'acronym' => "OFF-{$id}",
    ]);
}

function fakeEmployeesFor(string $deptCode, array $rows): void
{
    Http::fake([
        "api.example.test/api/data/v1/employees?*dept_code={$deptCode}*" => Http::response([
            'data' => $rows,
            'meta' => ['current_page' => 1, 'per_page' => 500, 'total' => count($rows), 'last_page' => 1],
        ]),
        // The masterlist the catalog resolves position codes against.
        'api.example.test/api/data/v1/positions*' => Http::response([
            'data' => [
                ['id' => 500, 'pos_code' => '2B002', 'pos_name' => 'COMPUTER PROGRAMMER I', 'salary_grade' => 11],
                ['id' => 304, 'pos_code' => '12313', 'pos_name' => 'ACCOUNTANT I', 'salary_grade' => 12],
            ],
            'meta' => ['current_page' => 1, 'per_page' => 500, 'total' => 2, 'last_page' => 1],
        ]),
        // The schedule the rates resolve against.
        'api.example.test/api/data/v1/salary-grades*' => Http::response([
            'data' => [
                ['id' => 1, 'salary_grade' => 11, 'year' => 2025, 'steps' => ['1' => 30024, '2' => 30308, '3' => 30597]],
                ['id' => 2, 'salary_grade' => 15, 'year' => 2025, 'steps' => ['1' => 45325]],
                ['id' => 3, 'salary_grade' => 36, 'year' => 2025, 'steps' => ['1' => 32659.5]],
            ],
            'meta' => ['current_page' => 1, 'per_page' => 500, 'total' => 3, 'last_page' => 1],
        ]),
    ]);
}

test('it lists the employees of the signed in user office department', function () {
    $office = scheduleOffice(18);
    $user = User::factory()->create(['office_id' => $office->id]);

    fakeEmployeesFor('1022', [
        [
            'pers_id' => '33085',
            'full_name' => 'TORIBIO JASPER VANJO NASTOR',
            'pos_code' => '2B002',
            'position_title' => null,
            'appointment_status' => 'PERMANENT',
            'salary_grade' => 11,
            'step' => 3,
        ],
    ]);

    $this->actingAs($user)
        ->get(route('personnel-schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('items.0.id', 33085)
            ->where('items.0.incumbent_name', 'TORIBIO JASPER VANJO NASTOR')
            // The title comes from the positions masterlist, not the employee row.
            ->where('items.0.position_title', 'COMPUTER PROGRAMMER I')
            // The same figures stand in for both years until budget figures exist.
            ->where('items.0.current_year_sg_step', '11/3')
            ->where('items.0.proposed_sg_step', '11/3')
            // The schedule publishes a monthly rate; the columns are per annum.
            ->where('items.0.current_year_amount', '367164.00')
            ->where('items.0.proposed_amount', '367164.00')
            // Both years carry the same figure, so the difference is zero.
            ->where('items.0.increase_decrease', '0.00')
            // The rest stays blank; the API does not expose it for the schedule.
            ->where('items.0.item_number', null)
            ->where('items.0.step_increment_effectivity', null)
        );

    Http::assertSent(fn (Request $request): bool => str_contains($request->url(), '/employees')
        && $request['dept_code'] === '1022');
});

test('it leaves the position title blank when the employee has no position code', function () {
    $office = scheduleOffice(18);
    $user = User::factory()->create(['office_id' => $office->id]);

    fakeEmployeesFor('1022', [
        [
            'pers_id' => '33085',
            'full_name' => 'TORIBIO JASPER VANJO NASTOR',
            'pos_code' => null,
            'appointment_status' => 'PERMANENT',
        ],
    ]);

    $this->actingAs($user)
        ->get(route('personnel-schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('items.0.incumbent_name', 'TORIBIO JASPER VANJO NASTOR')
            ->where('items.0.position_title', null)
        );
});

test('it leaves the position title blank for a code the masterlist does not know', function () {
    $office = scheduleOffice(18);
    $user = User::factory()->create(['office_id' => $office->id]);

    fakeEmployeesFor('1022', [
        [
            'pers_id' => '33085',
            'full_name' => 'TORIBIO JASPER VANJO NASTOR',
            'pos_code' => 'ZZZZZ',
            'appointment_status' => 'PERMANENT',
        ],
    ]);

    $this->actingAs($user)
        ->get(route('personnel-schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('items.0.position_title', null));
});

test('it fetches the positions masterlist once for the whole page of employees', function () {
    $office = scheduleOffice(18);
    $user = User::factory()->create(['office_id' => $office->id]);

    fakeEmployeesFor('1022', [
        ['pers_id' => '33085', 'full_name' => 'TORIBIO JASPER VANJO NASTOR', 'pos_code' => '2B002', 'appointment_status' => 'PERMANENT'],
        ['pers_id' => '31234', 'full_name' => 'SANTOS MARIA LARA', 'pos_code' => '12313', 'appointment_status' => 'COTERMINOUS'],
        ['pers_id' => '41002', 'full_name' => 'REYES JUAN DELA CRUZ', 'pos_code' => null, 'appointment_status' => 'CONSULTANT'],
    ]);

    $this->actingAs($user)
        ->get(route('personnel-schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('items.0.position_title', 'COMPUTER PROGRAMMER I')
            ->where('items.1.position_title', 'ACCOUNTANT I')
            ->where('items.2.position_title', null)
        );

    // 1 employee call + 1 masterlist call, not one call per employee.
    Http::assertSentCount(2);
});

test('it annualizes a monthly rate that carries a decimal', function () {
    $office = scheduleOffice(18);
    $user = User::factory()->create(['office_id' => $office->id]);

    fakeEmployeesFor('1022', [
        ['pers_id' => '1', 'full_name' => 'PART TIME ONE', 'appointment_status' => 'PERMANENT', 'salary_grade' => 11, 'step' => 1],
    ]);

    $this->actingAs($user)
        ->get(route('personnel-schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('items.0.current_year_amount', '360288.00'));
});

test('it leaves the amount blank when the schedule has no rate for the step', function () {
    // SG 15 step 1 exists but steps 2-8 do not, and a step above 8 is bad data.
    $office = scheduleOffice(18);
    $user = User::factory()->create(['office_id' => $office->id]);

    fakeEmployeesFor('1022', [
        ['pers_id' => '1', 'full_name' => 'NO SCHEDULED STEP', 'appointment_status' => 'PERMANENT', 'salary_grade' => 15, 'step' => 3],
        ['pers_id' => '2', 'full_name' => 'STEP PAST SCHEDULE', 'appointment_status' => 'PERMANENT', 'salary_grade' => 15, 'step' => 11],
        ['pers_id' => '3', 'full_name' => 'GRADE NOT IN SCHEDULE', 'appointment_status' => 'PERMANENT', 'salary_grade' => 29, 'step' => 1],
    ]);

    $this->actingAs($user)
        ->get(route('personnel-schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            // The grade still renders even with no rate behind it.
            ->where('items.0.current_year_sg_step', '15/3')
            ->where('items.0.current_year_amount', null)
            ->where('items.1.current_year_sg_step', '15/11')
            ->where('items.1.current_year_amount', null)
            ->where('items.2.current_year_sg_step', '29/1')
            ->where('items.2.current_year_amount', null)
            // No rate on either side means no difference to report.
            ->where('items.0.increase_decrease', null)
            ->where('items.1.increase_decrease', null)
            ->where('items.2.increase_decrease', null)
        );
});

test('it computes the increase as the proposed amount less the current one', function () {
    $office = scheduleOffice(18);
    $user = User::factory()->create(['office_id' => $office->id]);

    fakeEmployeesFor('1022', [
        ['pers_id' => '1', 'full_name' => 'PRICED ONE', 'appointment_status' => 'PERMANENT', 'salary_grade' => 11, 'step' => 1],
    ]);

    $this->actingAs($user)
        ->get(route('personnel-schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('items.0.current_year_amount', '360288.00')
            ->where('items.0.proposed_amount', '360288.00')
            ->where('items.0.increase_decrease', '0.00')
        );
});

test('it leaves the amount blank when the grade is an employment type marker', function () {
    // SG 36 has a flat monthly rate upstream, but it is a marker not a grade, so
    // it must not reach a pay column.
    $office = scheduleOffice(18);
    $user = User::factory()->create(['office_id' => $office->id]);

    fakeEmployeesFor('1022', [
        ['pers_id' => '1', 'full_name' => 'MARKER ONE', 'appointment_status' => 'PERMANENT', 'salary_grade' => 36, 'step' => 1],
    ]);

    $this->actingAs($user)
        ->get(route('personnel-schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('items.0.current_year_sg_step', null)
            ->where('items.0.current_year_amount', null)
            ->where('items.0.proposed_amount', null)
        );
});

test('it renders the salary grade without a step when the employee has none', function () {
    $office = scheduleOffice(18);
    $user = User::factory()->create(['office_id' => $office->id]);

    fakeEmployeesFor('1022', [
        [
            'pers_id' => '1',
            'full_name' => 'NO STEP ONE',
            'appointment_status' => 'PERMANENT',
            'salary_grade' => 15,
            'step' => null,
        ],
    ]);

    $this->actingAs($user)
        ->get(route('personnel-schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('items.0.current_year_sg_step', '15')
            ->where('items.0.proposed_sg_step', '15')
        );
});

test('it leaves the salary grade blank when the grade is an employment type marker', function () {
    // 35/36/37 are markers, not payable grades, and 40 has no schedule at all.
    $office = scheduleOffice(18);
    $user = User::factory()->create(['office_id' => $office->id]);

    fakeEmployeesFor('1022', [
        ['pers_id' => '1', 'full_name' => 'MARKER ONE', 'appointment_status' => 'PERMANENT', 'salary_grade' => 36, 'step' => 1],
        ['pers_id' => '2', 'full_name' => 'MARKER TWO', 'appointment_status' => 'PERMANENT', 'salary_grade' => 37, 'step' => 1],
        ['pers_id' => '3', 'full_name' => 'MARKER THREE', 'appointment_status' => 'PERMANENT', 'salary_grade' => 40, 'step' => 1],
        ['pers_id' => '4', 'full_name' => 'NO GRADE ONE', 'appointment_status' => 'PERMANENT', 'salary_grade' => null, 'step' => 11],
    ]);

    $this->actingAs($user)
        ->get(route('personnel-schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('items.0.current_year_sg_step', null)
            ->where('items.1.current_year_sg_step', null)
            ->where('items.2.current_year_sg_step', null)
            // A step with no grade carries no meaning either.
            ->where('items.3.current_year_sg_step', null)
        );
});

test('it excludes appointments that never belong on a personnel schedule', function () {
    // The exclusion list is provisional — see the controller's docblock. This
    // test pins the current behaviour, not an agreed policy.
    $office = scheduleOffice(18);
    $user = User::factory()->create(['office_id' => $office->id]);

    fakeEmployeesFor('1022', [
        ['pers_id' => '1', 'full_name' => 'PERMANENT ONE', 'pos_code' => '2B002', 'appointment_status' => 'PERMANENT'],
        ['pers_id' => '2', 'full_name' => 'CASUAL ONE', 'pos_code' => '2B002', 'appointment_status' => 'CASUAL'],
        ['pers_id' => '3', 'full_name' => 'OJT INTERN', 'pos_code' => '2B002', 'appointment_status' => 'OJT'],
        ['pers_id' => '4', 'full_name' => 'JOB ORDER ONE', 'pos_code' => '2B002', 'appointment_status' => 'JOB ORDER'],
        ['pers_id' => '5', 'full_name' => 'VOLUNTEER ONE', 'pos_code' => '2B002', 'appointment_status' => 'VOLUNTEER'],
        ['pers_id' => '6', 'full_name' => 'ITAX ONE', 'pos_code' => '2B002', 'appointment_status' => 'ITAX'],
        ['pers_id' => '7', 'full_name' => 'UNRECORDED ONE', 'pos_code' => '2B002', 'appointment_status' => null],
        ['pers_id' => '9', 'full_name' => 'COS ONE', 'pos_code' => '2B002', 'appointment_status' => 'CONTRACT OF SERVICE'],
        // Casing and padding must not smuggle an excluded row through.
        ['pers_id' => '8', 'full_name' => 'LOWERCASE OJT', 'pos_code' => '2B002', 'appointment_status' => 'ojt'],
    ]);

    $this->actingAs($user)
        ->get(route('personnel-schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('items', 2)
            ->where('items.0.incumbent_name', 'PERMANENT ONE')
            ->where('items.1.incumbent_name', 'CASUAL ONE')
        );
});

test('it excludes employees whose appointment status is absent entirely', function () {
    $office = scheduleOffice(18);
    $user = User::factory()->create(['office_id' => $office->id]);

    fakeEmployeesFor('1022', [
        ['pers_id' => '1', 'full_name' => 'PERMANENT ONE', 'pos_code' => '2B002', 'appointment_status' => 'PERMANENT'],
        ['pers_id' => '2', 'full_name' => 'MISSING KEY'],
    ]);

    $this->actingAs($user)
        ->get(route('personnel-schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('items', 1)
            ->where('items.0.incumbent_name', 'PERMANENT ONE')
        );
});

test('it uses the parent office department when the user is in a sub unit', function () {
    scheduleOffice(18);
    $subUnit = scheduleOffice(39, 18);
    $user = User::factory()->create(['office_id' => $subUnit->id]);

    fakeEmployeesFor('1022', [
        ['pers_id' => '31234', 'full_name' => 'SANTOS MARIA LARA', 'pos_code' => '12313', 'appointment_status' => 'PERMANENT'],
    ]);

    $this->actingAs($user)
        ->get(route('personnel-schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('items.0.incumbent_name', 'SANTOS MARIA LARA')
        );

    Http::assertSent(fn (Request $request): bool => str_contains($request->url(), '/employees')
        && $request['dept_code'] === '1022');
});

test('it lists no employees when the user office has no mapped department', function () {
    $office = scheduleOffice(5);
    $user = User::factory()->create(['office_id' => $office->id]);

    $this->actingAs($user)
        ->get(route('personnel-schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('items', []));

    Http::assertNothingSent();
});

test('it lists no employees when the user has no office', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('personnel-schedule.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('items', []));

    Http::assertNothingSent();
});

test('it resolves a department code back to its office', function () {
    $office = scheduleOffice(18);
    $subUnit = scheduleOffice(39, 18);

    expect(Office::forDeptCode('1022')->sole()->id)->toBe($office->id)
        ->and($office->deptCode())->toBe('1022')
        ->and($subUnit->deptCode())->toBe('1022')
        ->and(Office::forDeptCode('1048')->get())->toBeEmpty();
});

test('the department map only covers top level offices', function () {
    foreach (array_keys(Office::DEPT_CODES) as $officeId) {
        expect(scheduleOffice($officeId)->parent_id)->toBeNull();
    }

    expect(array_values(array_unique(Office::DEPT_CODES)))
        ->toHaveCount(count(Office::DEPT_CODES));
});

test('it rejects guests from the personnel schedule', function () {
    $this->get(route('personnel-schedule.index'))->assertRedirect('/login');
});
