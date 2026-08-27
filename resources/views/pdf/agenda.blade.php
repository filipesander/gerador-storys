<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <style>
        @font-face {
            font-family: 'Playfair Display';
            font-style: normal;
            font-weight: 400 900;
            src: url("{{ $playfairPath }}") format("truetype");
        }

        @page { margin: 122px 38px 66px 38px; }

        * { font-family: 'DejaVu Sans', sans-serif; }
        body { color: #2e2536; font-size: 11.5px; }
        .serif { font-family: 'Playfair Display', 'DejaVu Serif', serif; }

        /* ---- Header band (repeats on every page) ---- */
        .brandbar {
            position: fixed; top: -98px; left: -38px; right: -38px; height: 98px;
            background-color: #6d28d9; color: #ffffff;
        }
        .brandbar .pad { padding: 20px 38px; }
        .brandbar .eyebrow { text-transform: uppercase; letter-spacing: 4px; font-size: 9px; color: #d8b4fe; }
        .brandbar .name { font-size: 32px; line-height: 1.1; margin-top: 2px; }
        .brandbar .meta { position: absolute; top: 22px; right: 38px; text-align: right; }
        .brandbar .meta .period { font-size: 16px; font-weight: bold; }
        .brandbar .meta .range { font-size: 10.5px; color: #ede9fe; margin-top: 2px; }
        .brandbar .meta .count { font-size: 10px; color: #c4b5fd; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }

        /* ---- Footer (repeats on every page) ---- */
        .footer {
            position: fixed; bottom: -44px; left: 0; right: 0; height: 30px;
            color: #a99bc7; font-size: 9px; border-top: 1px solid #ede9fe; padding-top: 7px;
        }
        .footer .pages { float: right; }
        .footer .pages:after { content: counter(page) " / " counter(pages); }

        /* ---- Day section ---- */
        .day { margin-top: 18px; }
        .day:first-of-type { margin-top: 2px; }
        .day-title { font-size: 16px; color: #5b21b6; text-transform: capitalize; }
        .day-rule { height: 2px; background-color: #ede9fe; margin: 5px 0 9px; font-size: 0; line-height: 0; }

        /* ---- Table ---- */
        table { width: 100%; border-collapse: collapse; }
        thead th {
            background-color: #f5f3ff; color: #6d28d9; font-size: 8.5px; font-weight: bold;
            text-transform: uppercase; letter-spacing: 1px; text-align: left;
            padding: 8px 10px; border-bottom: 1px solid #e9d5ff;
        }
        tbody td { padding: 9px 10px; border-bottom: 1px solid #f1edfb; vertical-align: top; }
        tbody tr.alt td { background-color: #faf8ff; }
        .time { color: #6d28d9; font-weight: bold; white-space: nowrap; }
        .time .end { color: #b3a6d1; font-weight: normal; }
        .client { font-weight: bold; }
        .client .where { color: #9b8bbf; font-weight: normal; font-size: 9px; }
        .muted { color: #9b8bbf; }

        .pill { display: inline-block; padding: 3px 11px; border-radius: 20px; font-size: 9px; font-weight: bold; white-space: nowrap; }
        .pill-ok { background-color: #dcfce7; color: #15803d; }
        .pill-wait { background-color: #fef3c7; color: #b45309; }
        .pill-neutral { background-color: #efeaf7; color: #6b7280; }
        .pill-aplic { background-color: #ede9fe; color: #6d28d9; }
        .pill-manut { background-color: #e0f2fe; color: #0369a1; }

        .empty { color: #9b8bbf; font-style: italic; text-align: center; margin-top: 60px; }
    </style>
</head>
<body>
    <div class="brandbar">
        <div class="pad">
            <div class="eyebrow">Agenda</div>
            <div class="name serif">{{ $brand }}</div>
        </div>
        <div class="meta">
            <div class="period">{{ $period === 'semana' ? 'Semana' : 'Dia' }}</div>
            <div class="range">
                {{ $start->translatedFormat('d/m/Y') }}{{ $period === 'semana' ? ' – '.$end->translatedFormat('d/m/Y') : '' }}
            </div>
            <div class="count">{{ $total }} {{ $total === 1 ? 'agendamento' : 'agendamentos' }}</div>
        </div>
    </div>

    <div class="footer">
        <span>Gerado em {{ $generatedAt->translatedFormat('d/m/Y \à\s H:i') }} · {{ $brand }}</span>
        <span class="pages"></span>
    </div>

    @forelse ($grouped as $day => $items)
        <div class="day">
            <div class="day-title serif">{{ \Carbon\CarbonImmutable::parse($day)->translatedFormat('l, d \d\e F') }}</div>
            <div class="day-rule"></div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 76px;">Horário</th>
                        <th>Cliente</th>
                        <th>Serviço</th>
                        <th style="width: 58px;">Duração</th>
                        <th style="width: 96px;">Status</th>
                        <th style="width: 120px;">Tipo</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($items as $i => $a)
                        <tr class="{{ $i % 2 === 1 ? 'alt' : '' }}">
                            <td class="time">{{ $a->time }} <span class="end">– {{ $a->endTime }}</span></td>
                            <td class="client">
                                {{ $a->client ?: '—' }}
                                @if ($a->location !== '')
                                    <div class="where">{{ $a->location }}</div>
                                @endif
                            </td>
                            <td>{{ $a->service ?: '—' }}</td>
                            <td class="muted">{{ $a->durationMinutes }} min</td>
                            <td>
                                @php($s = mb_strtolower($a->status))
                                <span class="pill {{ str_starts_with($s, 'confirmado') ? 'pill-ok' : (str_contains($s, 'confirmar') ? 'pill-wait' : 'pill-neutral') }}">
                                    {{ $a->status ?: '—' }}
                                </span>
                            </td>
                            <td>
                                @if ($a->type !== '')
                                    @php($t = mb_strtolower($a->type))
                                    <span class="pill {{ str_contains($t, 'aplica') ? 'pill-aplic' : (str_contains($t, 'manuten') ? 'pill-manut' : 'pill-neutral') }}">
                                        {{ $a->type }}
                                    </span>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @empty
        <div class="empty">Nenhum agendamento no período.</div>
    @endforelse
</body>
</html>
