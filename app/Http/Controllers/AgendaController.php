<?php

namespace App\Http\Controllers;

use App\Services\AgendaImporter;
use App\Services\ProfessionalRegistry;
use App\Support\Appointment;
use App\Support\Professional;
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
    /**
     * Chave de sessão que lembra a última profissional escolhida, para que
     * voltar à agenda pelo menu não jogue de volta para a padrão.
     */
    private const SESSION_KEY = 'agenda.professional';

    public function __construct(
        private AgendaImporter $importer,
        private ProfessionalRegistry $professionals,
    ) {}

    public function index(Request $request): Response
    {
        $professional = $this->resolveProfessional($request);
        $period = $request->string('period')->toString() === 'semana' ? 'semana' : 'dia';
        $date = $this->resolveDate($request->string('date')->toString());
        $refresh = $request->boolean('refresh');
        [$start, $end] = $this->range($period, $date);

        return Inertia::render('agenda/index', [
            'brand' => $professional->label,
            'professional' => $professional->key,
            'professionals' => $this->professionals->all()
                ->map(fn (Professional $p) => $p->toArray())
                ->values()
                ->all(),
            'period' => $period,
            'date' => $date->toDateString(),
            'range' => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'appointments' => Inertia::defer(function () use ($professional, $start, $end, $refresh): array {
                try {
                    $items = $this->appointmentsInRange($professional, $start, $end, $refresh)
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
        $professional = $this->resolveProfessional($request);
        $period = $request->string('period')->toString() === 'semana' ? 'semana' : 'dia';
        $date = $this->resolveDate($request->string('date')->toString());
        [$start, $end] = $this->range($period, $date);

        try {
            $appointments = $this->appointmentsInRange($professional, $start, $end, false);
        } catch (\Throwable) {
            $appointments = collect();
        }

        $grouped = $appointments->groupBy(fn (Appointment $a) => $a->date->toDateString());

        $this->ensureFontCacheDirectoriesExist();

        $pdf = Pdf::loadView('pdf.agenda', [
            'brand' => $professional->label,
            'period' => $period,
            'start' => $start,
            'end' => $end,
            'grouped' => $grouped,
            'total' => $grouped->sum(fn (Collection $items) => $items->count()),
            'generatedAt' => CarbonImmutable::now(),
            'playfairPath' => resource_path('fonts/playfair-display.ttf'),
        ]);

        return $pdf->download("agenda-{$professional->key}-{$period}-{$date->toDateString()}.pdf");
    }

    /**
     * A profissional vem da query string; sem ela, usamos a última escolhida
     * na sessão e, por fim, a padrão da configuração.
     */
    protected function resolveProfessional(Request $request): Professional
    {
        $requested = $request->string('professional')->toString();

        $professional = $this->professionals->find($requested)
            ?? $this->professionals->resolve($request->session()->get(self::SESSION_KEY));

        $request->session()->put(self::SESSION_KEY, $professional->key);

        return $professional;
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
    protected function appointmentsInRange(Professional $professional, CarbonImmutable $start, CarbonImmutable $end, bool $refresh): Collection
    {
        return $this->importer->all($professional, $refresh)
            ->filter(fn (Appointment $a) => $a->date->betweenIncluded($start, $end))
            ->values();
    }
}
