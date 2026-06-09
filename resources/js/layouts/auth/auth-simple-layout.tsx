// import AppLogoIcon from '@/components/app-logo-icon';
// import { home } from '@/routes';
import { login } from '@/routes';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import logo from '../../../images/pglu-logo.png';
import buildingImage from '../../../images/pglu-building.png';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="relative flex min-h-svh w-full flex-col items-center justify-center gap-6 overflow-hidden bg-background p-6 md:p-10">
            <div
                className="pointer-events-none fixed inset-0 z-0 h-full w-full opacity-50"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 0% 0%, rgba(59, 130, 246, 0.6) 0%, transparent 100%),
                        radial-gradient(circle at 50% 100%, rgba(234, 179, 8, 0.5) 0%, transparent 100%),
                        radial-gradient(circle at 100% 20%, rgba(239, 68, 68, 0.6) 0%, transparent 100%)
                    `,
                    filter: 'blur(0px)',
                }}
            />

            <div
                className="pointer-events-none absolute inset-0 z-0 opacity-20"
                style={{
                    backgroundImage: `url(${buildingImage})`,
                    backgroundSize: '101% auto',
                    backgroundPosition: 'center -10%',
                    backgroundRepeat: 'no-repeat',
                }}
            />

            <div className="relative z-10 w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link
                            href={login()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="flex flex-col items-center">
                                <img
                                    src={logo}
                                    alt="PGLU Logo"
                                    className="aspect-square h-20 w-auto object-cover"
                                />
                                <span>LEAP</span>
                            </div>

                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-medium">{title}</h1>
                            <p className="text-center text-sm text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
