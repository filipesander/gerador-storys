import { forwardRef } from 'react';

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

type Props = {
    brand: string;
    period: 'dia' | 'semana';
    range: { start: string; end: string };
    items: Appointment[];
    generatedAt: Date;
};

function formatDate(iso: string): string {
    const [y, m, d] = iso.split('-');

    return `${d}/${m}/${y}`;
}

function statusPill(status: string): string {
    const s = status.toLowerCase();

    if (s.startsWith('confirmado')) {
        return 'ax-pill ax-pill-ok';
    }

    if (s.includes('confirmar')) {
        return 'ax-pill ax-pill-wait';
    }

    return 'ax-pill ax-pill-neutral';
}

function typePill(type: string): string {
    const t = type.toLowerCase();

    if (t.includes('aplica')) {
        return 'ax-pill ax-pill-aplic';
    }

    if (t.includes('manuten')) {
        return 'ax-pill ax-pill-manut';
    }

    return 'ax-pill ax-pill-neutral';
}

// Espelha resources/views/pdf/agenda.blade.php, em cores fixas (sem oklch/dark)
// para que o html-to-image gere o PNG idêntico ao PDF.
const CSS = `
.agenda-export { width: 794px; background: #ffffff; color: #2e2536; font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 11.5px; }
.agenda-export * { box-sizing: border-box; }
.agenda-export .ax-serif { font-family: 'Playfair Display', Georgia, serif; }
.agenda-export .ax-brandbar { position: relative; background-color: #6d28d9; color: #ffffff; padding: 20px 38px; min-height: 98px; }
.agenda-export .ax-eyebrow { text-transform: uppercase; letter-spacing: 4px; font-size: 9px; color: #d8b4fe; }
.agenda-export .ax-name { font-size: 32px; line-height: 1.1; margin-top: 2px; }
.agenda-export .ax-meta { position: absolute; top: 22px; right: 38px; text-align: right; }
.agenda-export .ax-period { font-size: 16px; font-weight: bold; }
.agenda-export .ax-range { font-size: 10.5px; color: #ede9fe; margin-top: 2px; }
.agenda-export .ax-count { font-size: 10px; color: #c4b5fd; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
.agenda-export .ax-body { padding: 26px 38px 16px; }
.agenda-export .ax-day { margin-top: 18px; }
.agenda-export .ax-day:first-of-type { margin-top: 0; }
.agenda-export .ax-day-title { font-size: 16px; color: #5b21b6; text-transform: capitalize; }
.agenda-export .ax-day-rule { height: 2px; background-color: #ede9fe; margin: 5px 0 9px; }
.agenda-export table { width: 100%; border-collapse: collapse; }
.agenda-export thead th { background-color: #f5f3ff; color: #6d28d9; font-size: 8.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; text-align: left; padding: 8px 10px; border-bottom: 1px solid #e9d5ff; }
.agenda-export tbody td { padding: 9px 10px; border-bottom: 1px solid #f1edfb; vertical-align: top; }
.agenda-export tbody tr.ax-alt td { background-color: #faf8ff; }
.agenda-export .ax-time { color: #6d28d9; font-weight: bold; white-space: nowrap; }
.agenda-export .ax-time .ax-end { color: #b3a6d1; font-weight: normal; }
.agenda-export .ax-client { font-weight: bold; }
.agenda-export .ax-muted { color: #9b8bbf; }
.agenda-export .ax-pill { display: inline-block; padding: 3px 11px; border-radius: 20px; font-size: 9px; font-weight: bold; white-space: nowrap; }
.agenda-export .ax-pill-ok { background-color: #dcfce7; color: #15803d; }
.agenda-export .ax-pill-wait { background-color: #fef3c7; color: #b45309; }
.agenda-export .ax-pill-neutral { background-color: #efeaf7; color: #6b7280; }
.agenda-export .ax-pill-aplic { background-color: #ede9fe; color: #6d28d9; }
.agenda-export .ax-pill-manut { background-color: #e0f2fe; color: #0369a1; }
.agenda-export .ax-empty { color: #9b8bbf; font-style: italic; text-align: center; margin: 60px 0; }
.agenda-export .ax-footer { color: #a99bc7; font-size: 9px; border-top: 1px solid #ede9fe; padding: 7px 38px 16px; }
.agenda-export .ax-footer .ax-pages { float: right; }
`;

const AgendaExportSheet = forwardRef<HTMLDivElement, Props>(
    function AgendaExportSheet(
        { brand, period, range, items, generatedAt },
        ref,
    ) {
        const groups = items.reduce<
            Record<string, { label: string; items: Appointment[] }>
        >((acc, item) => {
            acc[item.date] ??= { label: item.date_label, items: [] };
            acc[item.date].items.push(item);

            return acc;
        }, {});

        const total = items.length;
        const rangeText =
            period === 'semana'
                ? `${formatDate(range.start)} – ${formatDate(range.end)}`
                : formatDate(range.start);
        const generated = `${formatDate(generatedAt.toISOString().slice(0, 10))} às ${generatedAt
            .toTimeString()
            .slice(0, 5)}`;

        return (
            <div ref={ref} className="agenda-export">
                <style>{CSS}</style>

                <div className="ax-brandbar">
                    <div className="ax-eyebrow">Agenda</div>
                    <div className="ax-name ax-serif">{brand}</div>
                    <div className="ax-meta">
                        <div className="ax-period">
                            {period === 'semana' ? 'Semana' : 'Dia'}
                        </div>
                        <div className="ax-range">{rangeText}</div>
                        <div className="ax-count">
                            {total}{' '}
                            {total === 1 ? 'agendamento' : 'agendamentos'}
                        </div>
                    </div>
                </div>

                <div className="ax-body">
                    {total === 0 ? (
                        <div className="ax-empty">
                            Nenhum agendamento no período.
                        </div>
                    ) : (
                        Object.entries(groups).map(([day, group]) => (
                            <div key={day} className="ax-day">
                                <div className="ax-day-title ax-serif">
                                    {group.label}
                                </div>
                                <div className="ax-day-rule" />
                                <table>
                                    <thead>
                                        <tr>
                                            <th style={{ width: 76 }}>
                                                Horário
                                            </th>
                                            <th>Cliente</th>
                                            <th>Serviço</th>
                                            <th style={{ width: 58 }}>
                                                Duração
                                            </th>
                                            <th style={{ width: 96 }}>
                                                Status
                                            </th>
                                            <th style={{ width: 120 }}>Tipo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.items.map((a, i) => (
                                            <tr
                                                key={`${day}-${a.time}-${i}`}
                                                className={
                                                    i % 2 === 1 ? 'ax-alt' : ''
                                                }
                                            >
                                                <td className="ax-time">
                                                    {a.time}{' '}
                                                    <span className="ax-end">
                                                        – {a.end_time}
                                                    </span>
                                                </td>
                                                <td className="ax-client">
                                                    {a.client || '—'}
                                                </td>
                                                <td>{a.service || '—'}</td>
                                                <td className="ax-muted">
                                                    {a.duration_minutes} min
                                                </td>
                                                <td>
                                                    <span
                                                        className={statusPill(
                                                            a.status,
                                                        )}
                                                    >
                                                        {a.status || '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {a.type !== '' && (
                                                        <span
                                                            className={typePill(
                                                                a.type,
                                                            )}
                                                        >
                                                            {a.type}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))
                    )}
                </div>

                <div className="ax-footer">
                    <span>
                        Gerado em {generated} · {brand}
                    </span>
                </div>
            </div>
        );
    },
);

export default AgendaExportSheet;
