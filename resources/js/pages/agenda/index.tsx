import { Deferred, Head, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Download,
    ImageDown,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import AgendaExportSheet from '@/components/agenda/agenda-export-sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    buildAgendaFilename,
    exportAgendaToPng,
} from '@/lib/agenda/export-png';
import { cn } from '@/lib/utils';
import { agenda } from '@/routes';

type Appointment = {
    date: string;
    date_label: string;
    time: string;
    duration_minutes: number;
    end_time: string;
    client: string;
    service: string;
    status: string;
    type: string;
    notes: string;
    interested: string;
};

type AppointmentsPayload = { ok: boolean; items: Appointment[] };

type ProfessionalOption = { key: string; label: string };

type Props = {
    brand: string;
    professional: string;
    professionals: ProfessionalOption[];
    period: 'dia' | 'semana';
    date: string;
    range: { start: string; end: string };
    appointments?: AppointmentsPayload;
};

function shiftISO(iso: string, days: number): string {
    const d = new Date(`${iso}T00:00:00`);
    d.setDate(d.getDate() + days);

    return d.toISOString().slice(0, 10);
}

function visit(
    professional: string,
    period: string,
    date: string,
    refresh = false,
) {
    router.get(
        agenda().url,
        refresh
            ? { professional, period, date, refresh: 1 }
            : { professional, period, date },
        { preserveState: true, preserveScroll: true, preserveUrl: false },
    );
}

function statusClasses(status: string): string {
    const s = status.toLowerCase();

    if (s.startsWith('confirm')) {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
    }

    if (s.startsWith('a confirmar') || s.includes('confirmar')) {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
    }

    return 'bg-muted text-muted-foreground';
}

function typeClasses(type: string): string {
    const t = type.toLowerCase();

    if (t.includes('aplica')) {
        return 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300';
    }

    if (t.includes('manuten')) {
        return 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300';
    }

    return 'bg-muted text-muted-foreground';
}

function AgendaSkeleton() {
    return (
        <div className="space-y-3">
            {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
        </div>
    );
}

function AppointmentList({
    brand,
    payload,
}: {
    brand: string;
    payload: AppointmentsPayload;
}) {
    if (!payload.ok) {
        return (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Não consegui ler a planilha de {brand} agora. Confira se ela
                    está compartilhada como &quot;qualquer pessoa com o link
                    pode ver&quot; e tente de novo.
                </p>
                <Button
                    variant="outline"
                    className="mt-3"
                    onClick={() => router.reload()}
                >
                    Tentar de novo
                </Button>
            </div>
        );
    }

    if (payload.items.length === 0) {
        return (
            <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">
                Nenhum agendamento no período.
            </div>
        );
    }

    const groups = payload.items.reduce<
        Record<string, { label: string; items: Appointment[] }>
    >((acc, item) => {
        acc[item.date] ??= { label: item.date_label, items: [] };
        acc[item.date].items.push(item);

        return acc;
    }, {});

    return (
        <div className="space-y-6">
            {Object.entries(groups).map(([day, group]) => (
                <div key={day}>
                    <h2 className="mb-2 text-sm font-semibold text-muted-foreground capitalize">
                        {group.label}
                    </h2>
                    <div className="space-y-2">
                        {group.items.map((a, i) => (
                            <div
                                key={`${day}-${a.time}-${i}`}
                                className="flex items-start gap-4 rounded-xl border bg-card p-4"
                            >
                                <div className="w-20 shrink-0 text-sm font-semibold text-primary">
                                    {a.time}
                                    <div className="text-xs font-normal text-muted-foreground">
                                        {a.end_time}
                                    </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium">
                                        {a.client || '—'}
                                    </p>
                                    {(a.service || a.type) && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {a.service && (
                                                <p className="text-sm text-muted-foreground">
                                                    {a.service}
                                                </p>
                                            )}
                                            {a.type && (
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                                                        typeClasses(a.type),
                                                    )}
                                                >
                                                    {a.type}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {a.notes && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {a.notes}
                                        </p>
                                    )}
                                    {a.interested && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Interessadas: {a.interested}
                                        </p>
                                    )}
                                </div>
                                <span
                                    className={cn(
                                        'shrink-0 rounded-full px-3 py-1 text-xs font-medium',
                                        statusClasses(a.status),
                                    )}
                                >
                                    {a.status || '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function AgendaIndex({
    brand,
    professional,
    professionals,
    period,
    date,
    range,
    appointments,
}: Props) {
    const step = period === 'semana' ? 7 : 1;
    const exportHref = `/agenda/exportar?professional=${professional}&period=${period}&date=${date}`;

    const exportRef = useRef<HTMLDivElement>(null);
    const [exportingPng, setExportingPng] = useState(false);
    const items = appointments?.ok ? appointments.items : [];
    const canExportPng = (appointments?.ok ?? false) && items.length > 0;

    async function handleExportPng() {
        if (!exportRef.current || exportingPng) {
            return;
        }

        setExportingPng(true);

        try {
            await exportAgendaToPng(
                exportRef.current,
                buildAgendaFilename(professional, period, date),
            );
        } catch {
            toast.error('Não consegui gerar o PNG. Tente de novo.');
        } finally {
            setExportingPng(false);
        }
    }

    return (
        <>
            <Head title="Agenda" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {professionals.length > 1 && (
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                            Agenda de
                        </span>
                        <ToggleGroup
                            type="single"
                            value={professional}
                            onValueChange={(value) =>
                                value && visit(value, period, date)
                            }
                            variant="outline"
                        >
                            {professionals.map((option) => (
                                <ToggleGroupItem
                                    key={option.key}
                                    value={option.key}
                                >
                                    {option.label}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <ToggleGroup
                        type="single"
                        value={period}
                        onValueChange={(value) =>
                            value && visit(professional, value, date)
                        }
                        variant="outline"
                    >
                        <ToggleGroupItem value="dia">Dia</ToggleGroupItem>
                        <ToggleGroupItem value="semana">Semana</ToggleGroupItem>
                    </ToggleGroup>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                                visit(
                                    professional,
                                    period,
                                    shiftISO(date, -step),
                                )
                            }
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() =>
                                visit(
                                    professional,
                                    period,
                                    new Date().toISOString().slice(0, 10),
                                )
                            }
                        >
                            Hoje
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                                visit(
                                    professional,
                                    period,
                                    shiftISO(date, step),
                                )
                            }
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                        <input
                            type="date"
                            value={date}
                            onChange={(event) =>
                                event.target.value &&
                                visit(professional, period, event.target.value)
                            }
                            className="rounded-md border bg-background px-3 py-1.5 text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                                visit(professional, period, date, true)
                            }
                            title="Atualizar"
                        >
                            <RefreshCw className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleExportPng}
                            disabled={!canExportPng || exportingPng}
                            title="Baixar imagem PNG"
                        >
                            {exportingPng ? (
                                <Loader2 className="mr-2 size-4 animate-spin" />
                            ) : (
                                <ImageDown className="mr-2 size-4" />
                            )}
                            Exportar PNG
                        </Button>
                        <Button asChild>
                            <a href={exportHref}>
                                <Download className="mr-2 size-4" />
                                Exportar PDF
                            </a>
                        </Button>
                    </div>
                </div>

                <Deferred data="appointments" fallback={<AgendaSkeleton />}>
                    <AppointmentList
                        brand={brand}
                        payload={appointments ?? { ok: true, items: [] }}
                    />
                </Deferred>
            </div>

            <div
                aria-hidden
                className="pointer-events-none fixed top-0 -left-[10000px] -z-10 opacity-0"
            >
                <AgendaExportSheet
                    ref={exportRef}
                    brand={brand}
                    period={period}
                    range={range}
                    items={items}
                    generatedAt={new Date()}
                />
            </div>
        </>
    );
}

AgendaIndex.layout = {
    breadcrumbs: [{ title: 'Agenda', href: agenda() }],
};
