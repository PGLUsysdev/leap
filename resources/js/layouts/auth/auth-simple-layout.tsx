import { usePage } from '@inertiajs/react';
import type { AuthLayoutProps, SharedData } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { version } = usePage<SharedData>().props;

    return (
        <div className="bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center">
                            <img
                                src="/images/pglu-logo.png"
                                alt="Province of La Union official seal"
                                className="aspect-square size-14 rounded-full object-cover"
                            />
                            <img
                                src="/images/leap-temp-logo.png"
                                alt="LEAP - Local Expenditure Administration Program"
                                className="-ml-4 aspect-square size-14 rounded-full object-cover ring-2 ring-background"
                            />
                        </div>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-muted-foreground text-center text-sm">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                    <p className="text-muted-foreground text-center text-xs">
                        v{version}
                    </p>
                </div>
            </div>
        </div>
    );
}
