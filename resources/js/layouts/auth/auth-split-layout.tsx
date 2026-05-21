import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

function DecorativeBloom({
    className,
    size = 120,
    opacity = 0.12,
}: {
    className?: string;
    size?: number;
    opacity?: number;
}) {
    return (
        <svg
            viewBox="0 0 120 120"
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            className={className}
            style={{ opacity }}
            aria-hidden="true"
        >
            <g fill="white">
                <path d="M60 10c5.5 8.5 5.5 18 0 26.5C54.5 28 54.5 18.5 60 10Z" />
                <path d="M60 110c-5.5-8.5-5.5-18 0-26.5 5.5 8.5 5.5 18 0 26.5Z" />
                <path d="M10 60c8.5-5.5 18-5.5 26.5 0-8.5 5.5-18 5.5-26.5 0Z" />
                <path d="M110 60c-8.5-5.5-18-5.5-26.5 0 8.5 5.5 18 5.5 26.5 0Z" />
                <path d="M25.1 25.1c10 .8 17.8 6.2 21.6 14.6-10-.8-17.8-6.2-21.6-14.6Z" />
                <path d="M73.3 73.3c10 .8 17.8 6.2 21.6 14.6-10-.8-17.8-6.2-21.6-14.6Z" />
                <path d="M94.9 25.1c-3.8 8.4-11.6 13.8-21.6 14.6 3.8-8.4 11.6-13.8 21.6-14.6Z" />
                <path d="M46.7 73.3c-3.8 8.4-11.6 13.8-21.6 14.6 3.8-8.4 11.6-13.8 21.6-14.6Z" />
                <circle cx="60" cy="60" r="13" />
            </g>
        </svg>
    );
}

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            {/* ── Branded panel (desktop only) ── */}
            <div className="relative hidden h-full flex-col overflow-hidden lg:flex">
                {/* Gradient background: deep primary → accent */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent" />

                {/* Radial bloom — soft light at centre */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_40%,_rgba(255,255,255,0.10)_0%,_transparent_70%)]" />

                {/* Decorative florals */}
                <DecorativeBloom
                    className="absolute -top-8 -right-8"
                    size={200}
                    opacity={0.10}
                />
                <DecorativeBloom
                    className="absolute top-1/3 -left-12"
                    size={160}
                    opacity={0.07}
                />
                <DecorativeBloom
                    className="absolute -bottom-10 right-10"
                    size={220}
                    opacity={0.09}
                />

                {/* Content */}
                <div className="relative z-10 flex h-full flex-col p-10">
                    {/* Brand mark */}
                    <Link
                        href={home()}
                        className="flex items-center gap-3 text-primary-foreground"
                    >
                        <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
                            <AppLogoIcon className="size-6 text-white" />
                        </div>
                        <span className="font-display text-2xl font-semibold tracking-wide text-white">
                            {name}
                        </span>
                    </Link>

                    {/* Centred statement */}
                    <div className="flex flex-1 flex-col items-start justify-center">
                        <div className="max-w-xs space-y-4">
                            <div className="h-px w-12 bg-white/40" />
                            <p className="font-display text-4xl font-semibold leading-snug text-white">
                                Stories prontos
                                <br />
                                <span className="font-light italic opacity-80">
                                    para o seu salão
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Tagline footer */}
                    <div className="space-y-2">
                        <div className="h-px w-full bg-white/15" />
                        <p className="text-sm font-medium text-white/70">
                            Stories de horários do seu salão, em segundos.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Form panel ── */}
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    {/* Mobile brand (logo only) */}
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center lg:hidden"
                    >
                        <AppLogoIcon className="h-10 fill-current text-primary sm:h-12" />
                    </Link>

                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
