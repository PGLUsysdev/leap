import type { LbpFormNo } from './lbp-form-3-dialog';
import type { PersonnelScheduleItem } from './data-table/columns';

/**
 * The appointments that belong on each LBP form, split by where they are charged.
 *
 * Form 3 carries the plantilla items that occupy an LBP Form 3 position. Form 3A
 * carries the non-plantilla positions that are still funded under PS and so need
 * the Form 3A breakdown. Everything else — COS, job order, consultant, OJT,
 * volunteer — is charged to MOOE and belongs on neither form, so it never reaches
 * a personnel schedule.
 *
 * @see docs/pgluspace-data-api.md for the classification of each value
 */
const APPOINTMENTS_BY_FORM: Record<LbpFormNo, readonly string[]> = {
    '3': ['PERMANENT', 'TEMPORARY', 'COTERMINOUS', 'ELECTED'],
    '3A': ['CASUAL', 'CONTRACTUAL'],
};

/**
 * The rows belonging on one form.
 *
 * Matching is case-insensitive and trimmed because the API's own
 * `appointment_status` filter is case-sensitive; a differently-cased row would
 * otherwise be dropped from the form that should carry it.
 */
export function itemsForLbpForm(
    items: PersonnelScheduleItem[],
    formNo: LbpFormNo,
): PersonnelScheduleItem[] {
    const listed = APPOINTMENTS_BY_FORM[formNo];

    return items.filter((item) => {
        const status = item.appointment_status;

        return (
            typeof status === 'string' &&
            listed.includes(status.trim().toUpperCase())
        );
    });
}