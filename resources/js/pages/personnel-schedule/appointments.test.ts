import { describe, expect, it } from 'vitest';
import { itemsForLbpForm } from '@/pages/personnel-schedule/appointments';
import type { PersonnelScheduleItem } from '@/pages/personnel-schedule/data-table/columns';

function makeItem(
    id: number,
    appointmentStatus: string | null,
): PersonnelScheduleItem {
    return {
        id,
        appointment_status: appointmentStatus,
        item_number: null,
        old: null,
        new: null,
        position_title: 'Administrative Aide III',
        incumbent_name: `Person ${id}`,
        current_year_sg_step: '2/3',
        current_year_amount: '29187.00',
        proposed_sg_step: '3/1',
        proposed_amount: '31339.00',
        increase_decrease: '2152.00',
        step_increment_effectivity: null,
    };
}

const ALL_STATUSES: Array<string | null> = [
    'PERMANENT',
    'TEMPORARY',
    'COTERMINOUS',
    'ELECTED',
    'CASUAL',
    'CONTRACTUAL',
    'CONTRACT OF SERVICE',
    'JOB ORDER',
    'OJT',
    'VOLUNTEER',
    'CONSULTANT',
    null,
];

function namesFor(formNo: '3' | '3A') {
    return itemsForLbpForm(
        ALL_STATUSES.map((status, index) => makeItem(index, status)),
        formNo,
    ).map((item) => item.appointment_status);
}

describe('itemsForLbpForm', () => {
    it('should_KeepOnlyPlantillaAppointments_When_FormIsThree', () => {
        expect(namesFor('3')).toEqual([
            'PERMANENT',
            'TEMPORARY',
            'COTERMINOUS',
            'ELECTED',
        ]);
    });

    it('should_KeepOnlyNonPlantillaPsAppointments_When_FormIsThreeA', () => {
        expect(namesFor('3A')).toEqual(['CASUAL', 'CONTRACTUAL']);
    });

    it('should_NotRepeatARowAcrossForms_When_AnAppointmentAppearsOnOne', () => {
        const items = ALL_STATUSES.map((status, index) =>
            makeItem(index, status),
        );

        const onThree = itemsForLbpForm(items, '3');
        const onThreeA = itemsForLbpForm(items, '3A');

        const ids = [...onThree, ...onThreeA].map((item) => item.id);

        expect(new Set(ids).size).toBe(ids.length);
    });

    it('should_MatchCaseInsensitivelyAndTrim_When_StatusIsDifferentlyCased', () => {
        // The API's own filter is case-sensitive, so a differently-cased row
        // must not be dropped from the form that should carry it.
        const items = [makeItem(1, ' permanent '), makeItem(2, 'Casual')];

        expect(itemsForLbpForm(items, '3').map((item) => item.id)).toEqual([1]);
        expect(itemsForLbpForm(items, '3A').map((item) => item.id)).toEqual([2]);
    });

    it('should_ReturnEmptyArray_When_NoAppointmentMatches', () => {
        const items = [
            makeItem(1, 'JOB ORDER'),
            makeItem(2, 'OJT'),
            makeItem(3, null),
        ];

        expect(itemsForLbpForm(items, '3')).toEqual([]);
        expect(itemsForLbpForm(items, '3A')).toEqual([]);
    });

    it('should_ReturnEmptyArray_When_ThereAreNoItems', () => {
        expect(itemsForLbpForm([], '3')).toEqual([]);
        expect(itemsForLbpForm([], '3A')).toEqual([]);
    });

    it('should_ReturnNothing_When_TheStatusKeyIsAbsent', () => {
        // A row that predates the field carries no key at all.
        const item = { ...makeItem(1, 'PERMANENT') } as Partial<
            PersonnelScheduleItem
        >;
        delete item.appointment_status;

        expect(itemsForLbpForm([item as PersonnelScheduleItem], '3')).toEqual(
            [],
        );
    });
});