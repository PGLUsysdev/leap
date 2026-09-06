export function generateYearRange(
    currentYear: number,
    past: number,
    future: number,
) {
    const years = [];
    const startYear = currentYear - past;
    const endYear = currentYear + future;

    for (let i = startYear; i <= endYear; i++) {
        years.push(i);
    }

    return years;
}
