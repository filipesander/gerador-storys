# Agenda (Google Sheets) + Exportação PDF — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir o Dashboard por um menu "Agenda" que lê a planilha do Google (aba "Agendamento") via CSV, exibe os agendamentos por dia/semana e exporta o período em PDF.

**Architecture:** O backend busca o CSV público da planilha (`Http::get` + cache 60s), um serviço puro `AgendaImporter` parseia em DTOs `Appointment`, e um `AgendaController` serve a página (Inertia, dados via deferred prop) e o export (dompdf). O front é uma página Agenda com toggle dia/semana.

**Tech Stack:** Laravel 13 · Inertia v3 (deferred props) · React 19 · Tailwind v4 · barryvdh/laravel-dompdf.

---

## Regras de execução

- **NÃO commitar** (pule os "Step: Commit"). O usuário commita.
- Após mexer em PHP: `vendor/bin/pint --dirty --format agent`.
- Testes: Pest. Use `Http::fake()` (nunca rede real nos testes).

## Dados reais da aba "Agendamento" (referência)

Colunas: `Data`(dd/mm/aaaa) · `Horário`(HH:MM) · `Tempo do serviço`(h:mm:ss) · `Clientes` · `Serviço` · `Status`(Confirmado|A confirmar) · `Observações` · `Clientes interessadas`.
Endpoint CSV: `https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&gid=<GID>`.

---

## Task 1: Dependência, config e env

**Files:**
- Create: `config/agenda.php`
- Modify: `.env`, `.env.example`

- [ ] **Step 1: Instalar o dompdf**

Run: `composer require barryvdh/laravel-dompdf`
Expected: instala `barryvdh/laravel-dompdf` (auto-discovery registra a facade `Pdf`).

- [ ] **Step 2: Criar `config/agenda.php`**

```php
<?php

return [
    'sheet_id' => env('AGENDA_SHEET_ID', '14BBRNznsqfw1z2CLw-dC1t6F8FuP0x4SREUMXbb6l1Y'),
    'sheet_gid' => env('AGENDA_SHEET_GID', '614191594'),
    'cache_seconds' => (int) env('AGENDA_CACHE_SECONDS', 60),
];
```

- [ ] **Step 3: Adicionar env (em `.env` e `.env.example`)**

Acrescente ao final de ambos:

```
AGENDA_SHEET_ID=14BBRNznsqfw1z2CLw-dC1t6F8FuP0x4SREUMXbb6l1Y
AGENDA_SHEET_GID=614191594
```

- [ ] **Step 4: Validar config**

Run: `php artisan config:clear && php artisan config:show agenda`
Expected: mostra `sheet_id`, `sheet_gid`, `cache_seconds`.

---

## Task 2: DTO `Appointment` + serviço `AgendaImporter` (TDD)

**Files:**
- Create: `app/Support/Appointment.php`
- Create: `app/Services/AgendaImporter.php`
- Test: `tests/Unit/AgendaImporterTest.php`

- [ ] **Step 1: Escrever o teste de parse (falhando)**

Create `tests/Unit/AgendaImporterTest.php`:

```php
<?php

use App\Services\AgendaImporter;
use App\Support\Appointment;

it('parseia o CSV em appointments, ignorando linhas vazias e inválidas', function () {
    $csv = implode("\n", [
        '"Data","Horário","Tempo do serviço","Clientes","Serviço","Status","Observações","Clientes interessadas"',
        '"21/05/2026","08:00","1:30:00","Virna Santana","Volume Inglês 5D","Confirmado","",""',
        '"21/05/2026","17:00","0:00:00","Caroline Dias","","Confirmado","",""',
        '"","","","","","","",""',
        '"lixo","x","","","","","",""',
        '"22/05/2026","13:30","3:00:00","Jhessy","Brasileiro Fox Eyes","A confirmar","obs","Maria"',
    ]);

    $appointments = (new AgendaImporter())->parse($csv);

    expect($appointments)->toHaveCount(3);

    $first = $appointments->first();
    expect($first)->toBeInstanceOf(Appointment::class)
        ->and($first->client)->toBe('Virna Santana')
        ->and($first->durationMinutes)->toBe(90)
        ->and($first->endTime)->toBe('09:30')
        ->and($first->status)->toBe('Confirmado');

    $caroline = $appointments->firstWhere('client', 'Caroline Dias');
    expect($caroline->durationMinutes)->toBe(0)
        ->and($caroline->endTime)->toBe('17:00');

    $jhessy = $appointments->firstWhere('client', 'Jhessy');
    expect($jhessy->durationMinutes)->toBe(180)
        ->and($jhessy->endTime)->toBe('16:30')
        ->and($jhessy->status)->toBe('A confirmar')
        ->and($jhessy->notes)->toBe('obs')
        ->and($jhessy->interested)->toBe('Maria');
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

Run: `php artisan test tests/Unit/AgendaImporterTest.php --compact`
Expected: FAIL (classes inexistentes).

- [ ] **Step 3: Criar o DTO `app/Support/Appointment.php`**

```php
<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Support\Arrayable;

/**
 * @implements Arrayable<string, mixed>
 */
final readonly class Appointment implements Arrayable
{
    public function __construct(
        public CarbonImmutable $date,
        public string $time,
        public int $durationMinutes,
        public string $endTime,
        public string $client,
        public string $service,
        public string $status,
        public string $notes,
        public string $interested,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'date' => $this->date->toDateString(),
            'date_label' => $this->date->translatedFormat('l, d/m'),
            'time' => $this->time,
            'duration_minutes' => $this->durationMinutes,
            'end_time' => $this->endTime,
            'client' => $this->client,
            'service' => $this->service,
            'status' => $this->status,
            'notes' => $this->notes,
            'interested' => $this->interested,
        ];
    }
}
```

- [ ] **Step 4: Criar o serviço `app/Services/AgendaImporter.php`**

```php
<?php

namespace App\Services;

use App\Support\Appointment;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class AgendaImporter
{
    public function url(): string
    {
        $id = config('agenda.sheet_id');
        $gid = config('agenda.sheet_gid');

        return "https://docs.google.com/spreadsheets/d/{$id}/gviz/tq?tqx=out:csv&gid={$gid}";
    }

    public function fetch(bool $refresh = false): string
    {
        if ($refresh) {
            Cache::forget('agenda.csv');
        }

        return Cache::remember('agenda.csv', (int) config('agenda.cache_seconds', 60), function (): string {
            return Http::timeout(15)->get($this->url())->throw()->body();
        });
    }

    /**
     * @return Collection<int, Appointment>
     */
    public function all(bool $refresh = false): Collection
    {
        return $this->parse($this->fetch($refresh));
    }

    /**
     * @return Collection<int, Appointment>
     */
    public function parse(string $csv): Collection
    {
        $lines = preg_split('/\r\n|\r|\n/', trim($csv)) ?: [];
        $appointments = collect();

        foreach ($lines as $index => $line) {
            if ($index === 0 || trim($line) === '') {
                continue;
            }

            $row = str_getcsv($line);
            $date = $this->parseDate($row[0] ?? '');
            $time = trim($row[1] ?? '');

            if ($date === null || $time === '') {
                continue;
            }

            $duration = $this->durationToMinutes($row[2] ?? '');

            $appointments->push(new Appointment(
                date: $date,
                time: $time,
                durationMinutes: $duration,
                endTime: $this->addMinutes($time, $duration),
                client: trim($row[3] ?? ''),
                service: trim($row[4] ?? ''),
                status: trim($row[5] ?? ''),
                notes: trim($row[6] ?? ''),
                interested: trim($row[7] ?? ''),
            ));
        }

        return $appointments
            ->sortBy(fn (Appointment $a) => $a->date->toDateString().' '.$a->time)
            ->values();
    }

    private function parseDate(string $value): ?CarbonImmutable
    {
        $value = trim($value);

        if (! preg_match('/^\d{1,2}\/\d{1,2}\/\d{4}$/', $value)) {
            return null;
        }

        try {
            return CarbonImmutable::createFromFormat('d/m/Y', $value)->startOfDay();
        } catch (\Throwable) {
            return null;
        }
    }

    private function durationToMinutes(string $value): int
    {
        $parts = explode(':', trim($value));

        if (count($parts) < 2) {
            return 0;
        }

        return ((int) $parts[0]) * 60 + ((int) $parts[1]);
    }

    private function addMinutes(string $time, int $minutes): string
    {
        try {
            return CarbonImmutable::createFromFormat('H:i', $time)->addMinutes($minutes)->format('H:i');
        } catch (\Throwable) {
            return $time;
        }
    }
}
```

- [ ] **Step 5: Rodar e confirmar verde**

Run: `php artisan test tests/Unit/AgendaImporterTest.php --compact`
Expected: PASS (1 teste).

---

## Task 3: Controller `index`, rotas, redirect e testes de auth

**Files:**
- Create: `app/Http/Controllers/AgendaController.php`
- Modify: `routes/web.php`
- Modify: `config/fortify.php`
- Modify: `tests/Feature/Auth/AuthenticationTest.php`, `tests/Feature/Auth/RegistrationTest.php`
- Create: `tests/Feature/AgendaPageTest.php`

> Nesta task mantemos a rota `dashboard` existente (a remoção é na Task 5, junto da troca de imports no front, pra não quebrar o build).

- [ ] **Step 1: Criar `app/Http/Controllers/AgendaController.php` (só `index` por enquanto)**

```php
<?php

namespace App\Http\Controllers;

use App\Services\AgendaImporter;
use App\Support\Appointment;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class AgendaController extends Controller
{
    public function __construct(private AgendaImporter $importer) {}

    public function index(Request $request): Response
    {
        $period = $request->string('period')->toString() === 'semana' ? 'semana' : 'dia';
        $date = $this->resolveDate($request->string('date')->toString());
        $refresh = $request->boolean('refresh');
        [$start, $end] = $this->range($period, $date);

        return Inertia::render('agenda/index', [
            'period' => $period,
            'date' => $date->toDateString(),
            'range' => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'appointments' => Inertia::defer(function () use ($start, $end, $refresh): array {
                try {
                    $items = $this->appointmentsInRange($start, $end, $refresh)
                        ->map(fn (Appointment $a) => $a->toArray())
                        ->values()
                        ->all();

                    return ['ok' => true, 'items' => $items];
                } catch (\Throwable) {
                    return ['ok' => false, 'items' => []];
                }
            }),
        ]);
    }

    protected function resolveDate(string $value): CarbonImmutable
    {
        try {
            return $value !== '' ? CarbonImmutable::parse($value)->startOfDay() : CarbonImmutable::today();
        } catch (\Throwable) {
            return CarbonImmutable::today();
        }
    }

    /**
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    protected function range(string $period, CarbonImmutable $date): array
    {
        if ($period === 'semana') {
            return [$date->startOfWeek(CarbonImmutable::MONDAY), $date->endOfWeek(CarbonImmutable::SUNDAY)];
        }

        return [$date, $date];
    }

    /**
     * @return Collection<int, Appointment>
     */
    protected function appointmentsInRange(CarbonImmutable $start, CarbonImmutable $end, bool $refresh): Collection
    {
        return $this->importer->all($refresh)
            ->filter(fn (Appointment $a) => $a->date->betweenIncluded($start, $end))
            ->values();
    }
}
```

- [ ] **Step 2: Rotas em `routes/web.php`**

Adicione o import no topo e as rotas no grupo `['auth','verified']` (mantenha `dashboard` e `stories`):

```php
use App\Http\Controllers\AgendaController;
```

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::get('agenda', [AgendaController::class, 'index'])->name('agenda');
    Route::get('agenda/exportar', [AgendaController::class, 'export'])->name('agenda.exportar');
    Route::inertia('horarios', 'stories/index')->name('stories');
});
```

> A rota `agenda.exportar` aponta para um método ainda inexistente; só será chamada na Task 4. Não acesse-a até lá.

- [ ] **Step 3: Redirect pós-login → `/agenda`**

Em `config/fortify.php`, altere:

```php
    'home' => '/agenda',
```

- [ ] **Step 4: Atualizar asserts de redirect dos testes de auth**

Em `tests/Feature/Auth/AuthenticationTest.php` (linha ~22) e `tests/Feature/Auth/RegistrationTest.php` (linha ~24), troque:

```php
$response->assertRedirect(route('agenda', absolute: false));
```

(era `route('dashboard', ...)`).

- [ ] **Step 5: Criar `tests/Feature/AgendaPageTest.php`**

```php
<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $csv = implode("\n", [
        '"Data","Horário","Tempo do serviço","Clientes","Serviço","Status","Observações","Clientes interessadas"',
        '"21/05/2026","08:00","1:30:00","Virna Santana","Volume Inglês 5D","Confirmado","",""',
    ]);

    Http::fake(['docs.google.com/*' => Http::response($csv, 200, ['Content-Type' => 'text/csv'])]);
});

test('visitantes são redirecionados ao login', function () {
    $this->get(route('agenda'))->assertRedirect(route('login'));
});

test('usuário autenticado vê a agenda', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('agenda'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('agenda/index'));
});
```

- [ ] **Step 6: Gerar wayfinder e rodar os testes**

Run: `php artisan wayfinder:generate && php artisan config:clear && php artisan test tests/Feature/Auth tests/Feature/AgendaPageTest.php --compact`
Expected: PASS (auth redireciona pra agenda; agenda renderiza). `resources/js/routes/index.ts` passa a exportar `agenda`.

---

## Task 4: Exportação PDF

**Files:**
- Create: `resources/views/pdf/agenda.blade.php`
- Modify: `app/Http/Controllers/AgendaController.php` (adicionar `export`)
- Modify: `tests/Feature/AgendaPageTest.php` (adicionar teste de export)

- [ ] **Step 1: Criar o template `resources/views/pdf/agenda.blade.php`**

```blade
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
    <h1>Stephanie · Agenda</h1>
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
```

- [ ] **Step 2: Adicionar o método `export` no `AgendaController`**

Adicione o import e o método (mantenha o resto):

```php
use Barryvdh\DomPDF\Facade\Pdf;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
```

```php
    public function export(Request $request): HttpResponse
    {
        $period = $request->string('period')->toString() === 'semana' ? 'semana' : 'dia';
        $date = $this->resolveDate($request->string('date')->toString());
        [$start, $end] = $this->range($period, $date);

        $grouped = $this->appointmentsInRange($start, $end, false)
            ->groupBy(fn (Appointment $a) => $a->date->toDateString());

        $pdf = Pdf::loadView('pdf.agenda', [
            'period' => $period,
            'start' => $start,
            'end' => $end,
            'grouped' => $grouped,
        ]);

        return $pdf->download("agenda-{$period}-{$date->toDateString()}.pdf");
    }
```

- [ ] **Step 3: Teste de export em `tests/Feature/AgendaPageTest.php`**

Adicione:

```php
test('exporta a agenda em PDF', function () {
    $response = $this->actingAs(User::factory()->create())
        ->get(route('agenda.exportar', ['period' => 'dia', 'date' => '2026-05-21']));

    $response->assertOk();
    expect($response->headers->get('content-type'))->toContain('application/pdf');
});
```

- [ ] **Step 4: Rodar os testes**

Run: `php artisan test tests/Feature/AgendaPageTest.php --compact`
Expected: PASS (3 testes). `vendor/bin/pint --dirty --format agent` depois.

---

## Task 5: Frontend da Agenda + substituir Dashboard

**Files:**
- Create: `resources/js/pages/agenda/index.tsx`
- Modify: `resources/js/components/app-sidebar.tsx`
- Modify: `resources/js/pages/welcome.tsx` (botão "Painel" → agenda)
- Modify: `routes/web.php` (remover rota `dashboard`)
- Delete: `resources/js/pages/dashboard.tsx`, `tests/Feature/DashboardTest.php`

> A cobertura do antigo `DashboardTest` (auth + render da home logada) já está no `AgendaPageTest`. A remoção do dashboard foi aprovada no design.

- [ ] **Step 1: Criar `resources/js/pages/agenda/index.tsx`**

```tsx
import { Deferred, Head, router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
    notes: string;
    interested: string;
};

type AppointmentsPayload = { ok: boolean; items: Appointment[] };

type Props = {
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

function visit(period: string, date: string, refresh = false) {
    router.get(
        agenda().url,
        refresh ? { period, date, refresh: 1 } : { period, date },
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

function AgendaSkeleton() {
    return (
        <div className="space-y-3">
            {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
        </div>
    );
}

function AppointmentList({ payload }: { payload: AppointmentsPayload }) {
    if (!payload.ok) {
        return (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Não consegui ler a planilha agora. Verifique a conexão e tente de novo.
                </p>
                <Button variant="outline" className="mt-3" onClick={() => router.reload()}>
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

    const groups = payload.items.reduce<Record<string, { label: string; items: Appointment[] }>>(
        (acc, item) => {
            acc[item.date] ??= { label: item.date_label, items: [] };
            acc[item.date].items.push(item);
            return acc;
        },
        {},
    );

    return (
        <div className="space-y-6">
            {Object.entries(groups).map(([day, group]) => (
                <div key={day}>
                    <h2 className="mb-2 text-sm font-semibold capitalize text-muted-foreground">
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
                                    <p className="font-medium">{a.client || '—'}</p>
                                    {a.service && (
                                        <p className="text-sm text-muted-foreground">{a.service}</p>
                                    )}
                                    {a.notes && (
                                        <p className="mt-1 text-xs text-muted-foreground">{a.notes}</p>
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

export default function AgendaIndex({ period, date, appointments }: Props) {
    const step = period === 'semana' ? 7 : 1;
    const exportHref = `/agenda/exportar?period=${period}&date=${date}`;

    return (
        <>
            <Head title="Agenda" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <ToggleGroup
                        type="single"
                        value={period}
                        onValueChange={(value) => value && visit(value, date)}
                        variant="outline"
                    >
                        <ToggleGroupItem value="dia">Dia</ToggleGroupItem>
                        <ToggleGroupItem value="semana">Semana</ToggleGroupItem>
                    </ToggleGroup>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => visit(period, shiftISO(date, -step))}>
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button variant="outline" onClick={() => visit(period, new Date().toISOString().slice(0, 10))}>
                            Hoje
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => visit(period, shiftISO(date, step))}>
                            <ChevronRight className="size-4" />
                        </Button>
                        <input
                            type="date"
                            value={date}
                            onChange={(event) => event.target.value && visit(period, event.target.value)}
                            className="rounded-md border bg-background px-3 py-1.5 text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => visit(period, date, true)} title="Atualizar">
                            <RefreshCw className="size-4" />
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
                    <AppointmentList payload={appointments ?? { ok: true, items: [] }} />
                </Deferred>
            </div>
        </>
    );
}

AgendaIndex.layout = {
    breadcrumbs: [{ title: 'Agenda', href: agenda() }],
};
```

- [ ] **Step 2: Sidebar — "Agenda" no lugar de "Dashboard"**

Em `resources/js/components/app-sidebar.tsx`: troque o import e o item de nav. Importe `CalendarDays` de `lucide-react` e `agenda` de `@/routes`; remova o uso de `dashboard` e `LayoutGrid`. O item vira:

```tsx
{
    title: 'Agenda',
    href: agenda(),
    icon: CalendarDays,
},
```

E o `<Link href={...}>` do cabeçalho/logo que usava `dashboard()` deve usar `agenda()`.

- [ ] **Step 3: Landing — botão "Painel" → agenda**

Em `resources/js/pages/welcome.tsx`: troque `import { dashboard, login, register }` para `import { agenda, login, register }` e o `href={dashboard()}` do botão "Painel" para `href={agenda()}`.

- [ ] **Step 4: Remover a rota e a página do dashboard**

Em `routes/web.php`, remova a linha:

```php
Route::inertia('dashboard', 'dashboard')->name('dashboard');
```

Delete os arquivos:

```bash
rm resources/js/pages/dashboard.tsx tests/Feature/DashboardTest.php
```

- [ ] **Step 5: Regenerar wayfinder e validar build/tipos**

Run: `php artisan wayfinder:generate && npm run types:check && npm run build`
Expected: verde (o export `dashboard` some de `@/routes`; nenhum import remanescente o referencia).

---

## Task 6: Gates finais

- [ ] **Step 1: Formatar PHP**

Run: `vendor/bin/pint --dirty --format agent`
Expected: sem erros.

- [ ] **Step 2: Suíte completa**

```bash
npm run lint
npm run types:check
npm run build
php artisan config:clear
php artisan test tests/Feature tests/Unit --compact
```
Expected: tudo verde (inclui `AgendaImporterTest`, `AgendaPageTest`, auth com redirect pra agenda).

- [ ] **Step 3: Verificação manual (usuário)**

`composer run dev`, logar (deve cair em `/agenda`), conferir toggle Dia/Semana, navegação de data, skeleton→lista, badges de status, "Atualizar", e "Exportar PDF" (abre o PDF com os agendamentos do período).

---

## Self-review (feito)

- **Cobertura do spec:** ingestão CSV+cache (T1/T2) ✓ · parser/DTO (T2) ✓ · controller index deferred (T3) ✓ · substituir dashboard + redirect + testes auth (T3/T5) ✓ · export PDF dia/semana (T4) ✓ · página dia/semana + estados (T5) ✓ · testes unit+feature com Http::fake (T2/T3/T4) ✓ · dep dompdf (T1) ✓.
- **Placeholders:** nenhum — backend, PDF e página têm código completo.
- **Consistência de tipos:** `Appointment` (T2) ↔ `toArray()` keys ↔ tipo TS `Appointment` (T5); `AgendaImporter::all/parse/fetch` (T2) usados no controller (T3/T4); rota `agenda` (T3) usada no front (T5); `appointments` deferred `{ok, items}` (T3) ↔ `AppointmentsPayload` (T5).
- **Ordem segura:** rota `dashboard` só sai na T5 junto da correção de imports e wayfinder, mantendo build verde nas tasks anteriores.
