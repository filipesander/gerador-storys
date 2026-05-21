<?php

namespace App\Http\Controllers;

use App\Services\AgendaImporter;
use App\Support\Appointment;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
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

        $pdf = Pdf::loadView('pdf.agenda', [
            'period' => $period,
            'start' => $start,
            'end' => $end,
            'grouped' => $grouped,
        ]);

        return $pdf->download("agenda-{$period}-{$date->toDateString()}.pdf");
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
