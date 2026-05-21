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
