import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <div className="flex shrink-0 items-center">
                <img
                    src="/images/pglu-logo.png"
                    alt="Province of La Union official seal"
                    className="aspect-square size-8 rounded-full object-cover"
                />
                <img
                    src="/images/leap-temp-logo.png"
                    alt="LEAP - Local Expenditure Administration Program"
                    className="-ml-2 aspect-square size-8 rounded-full object-cover ring-2 ring-sidebar"
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">
                    {name}
                </span>
            </div>
        </>
    );
}
