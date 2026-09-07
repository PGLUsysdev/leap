export { cn } from "cn"
import type { InertiaLinkProps } from '@inertiajs/react';

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export function formatCurrency(value: string): string {
    const num = Number(value);

    if (!value || Number.isNaN(num) || num <= 0) {
        return '-';
    }

    return num.toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}
