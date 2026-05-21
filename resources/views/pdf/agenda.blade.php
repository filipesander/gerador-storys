<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <style>
        * { font-family: 'DejaVu Sans', sans-serif; }
        body { color: #2e2536; font-size: 12px; margin: 24px; }
        h1 { color: #7c3aed; font-size: 20px; margin: 0; }
        .sub { color: #6b7280; margin: 2px 0 16px; }
        .day { margin-top: 16px; }
        .day h2 { font-size: 13px; color: #5d3f96; border-bottom: 2px solid #ede9fe; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 6px; }
        th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
        th { background: #f5f3ff; color: #5d3f96; font-size: 11px; text-transform: uppercase; }
        .empty { color: #9ca3af; }
    </style>
</head>
<body>
    <h1>Thay · Agenda</h1>
    <div class="sub">
        {{ $period === 'semana' ? 'Semana' : 'Dia' }} —
        {{ $start->translatedFormat('d/m/Y') }}{{ $period === 'semana' ? ' a '.$end->translatedFormat('d/m/Y') : '' }}
    </div>

    @forelse ($grouped as $day => $items)
        <div class="day">
            <h2>{{ \Carbon\CarbonImmutable::parse($day)->translatedFormat('l, d/m/Y') }}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Horário</th><th>Cliente</th><th>Serviço</th><th>Duração</th><th>Status</th><th>Observações</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($items as $a)
                        <tr>
                            <td>{{ $a->time }}–{{ $a->endTime }}</td>
                            <td>{{ $a->client ?: '—' }}</td>
                            <td>{{ $a->service ?: '—' }}</td>
                            <td>{{ $a->durationMinutes }} min</td>
                            <td>{{ $a->status ?: '—' }}</td>
                            <td>{{ $a->notes }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    @empty
        <p class="empty">Nenhum agendamento no período.</p>
    @endforelse
</body>
</html>
