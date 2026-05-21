import { Head, Link, usePage } from '@inertiajs/react';
import { Calendar, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StoryCanvas, STORY_HEIGHT, STORY_WIDTH } from '@/components/stories/story-canvas';
import { TEMPLATES, getTemplate } from '@/lib/stories/templates';
import type { StoryData } from '@/lib/stories/story-data';
import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard, login, register } from '@/routes';

// --- Sample data for the hero mockup ---
const DEMO_DATA: StoryData = {
    mode: 'semana',
    title: 'Horários da Semana',
    weekSlots: [
        { id: '1', weekday: 'terca', times: ['09:00', '11:30', '14:00'] },
        { id: '2', weekday: 'quinta', times: ['10:00', '15:00'] },
        { id: '3', weekday: 'sexta', times: ['09:30', '13:00', '16:30'] },
        { id: '4', weekday: 'sabado', times: ['08:00', '10:30'] },
    ],
    date: '',
    dayTimes: [],
};

const HERO_PREVIEW_WIDTH = 220;
const HERO_SCALE = HERO_PREVIEW_WIDTH / STORY_WIDTH;
const HERO_PREVIEW_HEIGHT = STORY_HEIGHT * HERO_SCALE;

const THUMB_WIDTH = 88;
const THUMB_SCALE = THUMB_WIDTH / STORY_WIDTH;
const THUMB_HEIGHT = STORY_HEIGHT * THUMB_SCALE;

// ---- Steps data ----
const STEPS = [
    {
        icon: Calendar,
        num: '01',
        title: 'Preencha os horários',
        desc: 'Adicione os dias e horários vagos da semana ou de um dia.',
    },
    {
        icon: Sparkles,
        num: '02',
        title: 'Escolha um template',
        desc: 'Estilos elegantes em tons de lilás, prontos para a sua marca.',
    },
    {
        icon: Download,
        num: '03',
        title: 'Baixe e poste',
        desc: 'Exporte um PNG no formato story e publique no Instagram.',
    },
];

export default function Welcome() {
    const { auth } = usePage().props;
    const heroTemplate = getTemplate('lavanda-floral');
    const currentYear = new Date().getFullYear();

    return (
        <>
            <Head title="Stories de horários prontos em segundos" />

            <div className="min-h-screen bg-background text-foreground antialiased">
                {/* ======== TOPBAR ======== */}
                <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                        {/* Wordmark */}
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                                <AppLogoIcon className="size-5" />
                            </div>
                            <span className="font-display text-xl font-bold tracking-tight text-foreground">
                                Stephanie
                            </span>
                        </div>

                        {/* Nav actions */}
                        <nav className="flex items-center gap-3">
                            {auth.user ? (
                                <Button asChild size="sm">
                                    <Link href={dashboard()}>Painel</Link>
                                </Button>
                            ) : (
                                <>
                                    <Button asChild variant="ghost" size="sm">
                                        <Link href={login()}>Entrar</Link>
                                    </Button>
                                    <Button asChild size="sm">
                                        <Link href={register()}>Criar conta</Link>
                                    </Button>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* ======== HERO ======== */}
                <section className="relative overflow-hidden">
                    {/* Background decorative elements */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 select-none"
                    >
                        {/* Large ambient circle top-right */}
                        <div className="absolute -top-32 -right-32 size-[600px] rounded-full bg-primary/8 blur-[120px]" />
                        {/* Small accent circle bottom-left */}
                        <div className="absolute bottom-0 -left-16 size-[300px] rounded-full bg-accent/40 blur-[80px]" />
                        {/* Grid pattern overlay */}
                        <svg
                            className="absolute inset-0 h-full w-full opacity-[0.025]"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <defs>
                                <pattern
                                    id="grid"
                                    width="40"
                                    height="40"
                                    patternUnits="userSpaceOnUse"
                                >
                                    <path
                                        d="M 40 0 L 0 0 0 40"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1"
                                    />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                        </svg>
                        {/* Decorative large italic S */}
                        <span className="font-display absolute -bottom-8 -left-4 select-none text-[220px] font-bold italic leading-none text-primary/5 lg:text-[320px]">
                            S
                        </span>
                    </div>

                    <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 px-6 py-20 lg:flex-row lg:items-center lg:gap-16 lg:py-28">
                        {/* ---- Left: copy ---- */}
                        <div className="flex-1 text-center lg:text-left">
                            {/* Eyebrow pill */}
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-4 py-1.5 text-sm font-medium text-primary">
                                <AppLogoIcon className="size-3.5" />
                                Gerador de Stories para Salões
                            </div>

                            <h1 className="font-display mb-6 text-4xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
                                Stories de horários{' '}
                                <span className="relative inline-block">
                                    <span className="relative z-10 text-primary">prontos</span>
                                    {/* Underline accent */}
                                    <svg
                                        aria-hidden
                                        className="absolute -bottom-1 left-0 w-full"
                                        viewBox="0 0 200 12"
                                        preserveAspectRatio="none"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M2 9C50 3 100 1 198 7"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            className="text-primary/40"
                                        />
                                    </svg>
                                </span>{' '}
                                em segundos
                            </h1>

                            <p className="mb-8 max-w-lg text-lg leading-relaxed text-muted-foreground lg:text-xl">
                                Chega de abrir o Canva. Digite os horários livres, escolha um
                                template e baixe a imagem pronta para postar no Instagram do seu
                                salão.
                            </p>

                            <div className="flex flex-col items-center gap-3 sm:flex-row lg:items-start">
                                <Button asChild size="lg" className="px-8 text-base shadow-lg shadow-primary/25">
                                    <Link href={login()}>Começar agora</Link>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="px-8 text-base">
                                    <a href="#como-funciona">Ver como funciona</a>
                                </Button>
                            </div>
                        </div>

                        {/* ---- Right: phone mockup ---- */}
                        <div className="relative flex shrink-0 items-center justify-center lg:justify-end">
                            {/* Floating secondary phone (blurred/offset) */}
                            <div
                                aria-hidden
                                className="absolute -left-8 top-4 opacity-40 blur-sm lg:-left-12"
                                style={{
                                    width: HERO_PREVIEW_WIDTH * 0.8,
                                    height: HERO_PREVIEW_HEIGHT * 0.8,
                                }}
                            >
                                <div className="h-full w-full overflow-hidden rounded-[2rem] border-4 border-foreground/8 bg-background shadow-xl">
                                    <div
                                        style={{
                                            width: STORY_WIDTH,
                                            height: STORY_HEIGHT,
                                            transform: `scale(${HERO_SCALE * 0.8})`,
                                            transformOrigin: 'top left',
                                        }}
                                    >
                                        <StoryCanvas
                                            template={getTemplate('gradiente-vibrante')}
                                            data={DEMO_DATA}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Main phone */}
                            <div className="relative z-10">
                                {/* Glow behind phone */}
                                <div className="absolute inset-0 scale-95 rounded-[2.5rem] bg-primary/20 blur-2xl" />

                                <div
                                    className="relative overflow-hidden rounded-[2.5rem] border-4 border-foreground/12 bg-background shadow-2xl"
                                    style={{
                                        width: HERO_PREVIEW_WIDTH,
                                        height: HERO_PREVIEW_HEIGHT,
                                    }}
                                >
                                    {/* Phone notch */}
                                    <div className="absolute top-3 left-1/2 z-20 h-4 w-16 -translate-x-1/2 rounded-full bg-foreground/10" />

                                    <div
                                        style={{
                                            width: STORY_WIDTH,
                                            height: STORY_HEIGHT,
                                            transform: `scale(${HERO_SCALE})`,
                                            transformOrigin: 'top left',
                                        }}
                                    >
                                        <StoryCanvas template={heroTemplate} data={DEMO_DATA} />
                                    </div>
                                </div>

                                {/* Floating badge */}
                                <div className="absolute -right-4 -bottom-3 flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-lg">
                                    <span className="text-lg">✨</span>
                                    <div>
                                        <p className="text-xs font-semibold text-foreground">Story pronto!</p>
                                        <p className="text-xs text-muted-foreground">em 30 seg</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ======== COMO FUNCIONA ======== */}
                <section
                    id="como-funciona"
                    className="relative border-t border-border/50 bg-muted/30 py-20 lg:py-28"
                >
                    <div className="mx-auto max-w-6xl px-6">
                        {/* Section header */}
                        <div className="mb-14 text-center">
                            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
                                Simples assim
                            </p>
                            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
                                Como funciona
                            </h2>
                        </div>

                        {/* Steps grid */}
                        <div className="grid gap-8 md:grid-cols-3">
                            {STEPS.map((step, index) => {
                                const Icon = step.icon;
                                return (
                                    <div key={step.num} className="group relative">
                                        {/* Connector line between steps */}
                                        {index < STEPS.length - 1 && (
                                            <div
                                                aria-hidden
                                                className="absolute top-8 left-full z-0 hidden h-px w-full -translate-x-4 bg-gradient-to-r from-border to-transparent md:block"
                                            />
                                        )}

                                        <div className="relative z-10 flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-8 shadow-sm transition-shadow duration-300 hover:shadow-md">
                                            {/* Number + Icon row */}
                                            <div className="flex items-start gap-4">
                                                <span className="font-display text-5xl font-bold leading-none text-primary/15 select-none">
                                                    {step.num}
                                                </span>
                                                <div className="ml-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                    <Icon className="size-5" />
                                                </div>
                                            </div>

                                            <h3 className="font-display text-xl font-semibold text-foreground">
                                                {step.title}
                                            </h3>
                                            <p className="leading-relaxed text-muted-foreground">
                                                {step.desc}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ======== VITRINE DE TEMPLATES ======== */}
                <section className="border-t border-border/50 py-20 lg:py-28">
                    <div className="mx-auto max-w-6xl px-6">
                        {/* Section header */}
                        <div className="mb-14 text-center">
                            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
                                Templates exclusivos
                            </p>
                            <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
                                Modelos lindos, prontos para usar
                            </h2>
                        </div>

                        {/* Templates strip */}
                        <div className="flex flex-wrap items-start justify-center gap-6">
                            {TEMPLATES.map((template, index) => (
                                <div
                                    key={template.id}
                                    className="group flex flex-col items-center gap-3"
                                    style={{
                                        /* Stagger vertical offset for editorial feel */
                                        marginTop: index % 2 === 1 ? 24 : 0,
                                    }}
                                >
                                    <div
                                        className="overflow-hidden rounded-2xl border-2 border-transparent shadow-md transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-xl group-hover:shadow-primary/10"
                                        style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT }}
                                    >
                                        <div
                                            style={{
                                                width: STORY_WIDTH,
                                                height: STORY_HEIGHT,
                                                transform: `scale(${THUMB_SCALE})`,
                                                transformOrigin: 'top left',
                                            }}
                                        >
                                            <StoryCanvas
                                                template={template}
                                                data={DEMO_DATA}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                                        {template.name}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* CTA below strip */}
                        <div className="mt-12 text-center">
                            <p className="mb-4 text-sm text-muted-foreground">
                                Mais templates chegando em breve
                            </p>
                            <Button asChild size="lg" className="px-10 shadow-lg shadow-primary/20">
                                <Link href={register()}>Experimentar grátis</Link>
                            </Button>
                        </div>
                    </div>
                </section>

                {/* ======== CTA FINAL ======== */}
                <section className="relative overflow-hidden border-t border-border/50 py-20 lg:py-28">
                    {/* Background gradient */}
                    <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/30" />
                        <div className="absolute top-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    </div>

                    <div className="relative mx-auto max-w-3xl px-6 text-center">
                        <div className="mb-6 inline-flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <AppLogoIcon className="size-8" />
                        </div>

                        <h2 className="font-display mb-4 text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
                            Pronta para economizar tempo, Stephanie?
                        </h2>

                        <p className="mb-8 text-lg text-muted-foreground">
                            Crie seu primeiro story de horários agora mesmo. É grátis e leva
                            menos de um minuto.
                        </p>

                        <Button asChild size="lg" className="px-12 text-lg shadow-xl shadow-primary/25">
                            <Link href={login()}>Entrar</Link>
                        </Button>
                    </div>
                </section>

                {/* ======== RODAPÉ ======== */}
                <footer className="border-t border-border/50 bg-muted/20 py-8">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                                <AppLogoIcon className="size-4" />
                            </div>
                            <span className="font-display text-sm font-semibold text-foreground">
                                Stephanie
                            </span>
                        </div>

                        <p className="text-center text-sm text-muted-foreground">
                            Feito com 💜 para a Stephanie &mdash; {currentYear}
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}
