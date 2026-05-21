<?php

namespace App\Services;

use App\Support\Appointment;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

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

        if (count($lines) < 2) {
            return collect();
        }

        $header = str_getcsv($lines[0], separator: ',', enclosure: '"', escape: '');

        $columns = [];
        foreach ($header as $index => $name) {
            $columns[$this->normalizeHeader($name)] = $index;
        }

        $appointments = collect();

        foreach ($lines as $index => $line) {
            if ($index === 0 || trim($line) === '') {
                continue;
            }

            $row = str_getcsv($line, separator: ',', enclosure: '"', escape: '');

            $get = function (string $key) use ($row, $columns): string {
                $position = $columns[$key] ?? null;

                return $position === null ? '' : trim($row[$position] ?? '');
            };

            $date = $this->parseDate($get('data'));
            $time = $get('horario');

            if ($date === null || $time === '') {
                continue;
            }

            $duration = $this->durationToMinutes($get('tempo do servico'));

            $appointments->push(new Appointment(
                date: $date,
                time: $time,
                durationMinutes: $duration,
                endTime: $this->addMinutes($time, $duration),
                client: $get('clientes'),
                service: $get('servico'),
                status: $get('status'),
                type: $get('aplicacao ou manutencao'),
                notes: $get('observacoes'),
                interested: $get('clientes interessadas'),
            ));
        }

        return $appointments
            ->sortBy(fn (Appointment $a) => $a->date->toDateString().' '.$a->time)
            ->values();
    }

    private function normalizeHeader(string $value): string
    {
        return Str::ascii(trim(mb_strtolower($value)));
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
