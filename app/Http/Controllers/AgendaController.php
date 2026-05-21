<?php

namespace App\Http\Controllers;

use App\Services\AgendaImporter;
use App\Support\Appointment;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

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

    public function export(Request $request): HttpResponse
    {
        $period = $request->string('period')->toString() === 'semana' ? 'semana' : 'dia';
        $date = $this->resolveDate($request->string('date')->toString());
        [$start, $end] = $this->range($period, $date);

        $grouped = $this->appointmentsInRange($start, $end, false)
            ->groupBy(fn (Appointment $a) => $a->date->toDateString());

        $this->ensureFontCacheDirectoriesExist();

        $pdf = Pdf::loadView('pdf.agenda', [
            'brand' => config('agenda.brand', 'Thay'),
            'period' => $period,
            'start' => $start,
            'end' => $end,
            'grouped' => $grouped,
            'total' => $grouped->sum(fn (Collection $items) => $items->count()),
            'generatedAt' => CarbonImmutable::now(),
            'playfairPath' => resource_path('fonts/playfair-display.ttf'),
        ]);

        return $pdf->download("agenda-{$period}-{$date->toDateString()}.pdf");
    }

    /**
     * O DomPDF grava o cache de métricas das fontes em font_dir/font_cache
     * (storage/fonts por padrão). Esse diretório é ignorado pelo git e não
     * existe em deploys novos, o que fazia o export quebrar com 500 ao
     * registrar a @font-face do PDF. Garantimos que os diretórios existam.
     */
    protected function ensureFontCacheDirectoriesExist(): void
    {
        $directories = array_unique(array_filter([
            storage_path('fonts'),
            config('dompdf.options.font_dir'),
            config('dompdf.options.font_cache'),
        ]));

        foreach ($directories as $directory) {
            File::ensureDirectoryExists($directory);
        }
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
