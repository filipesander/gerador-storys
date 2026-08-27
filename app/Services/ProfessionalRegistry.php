<?php

namespace App\Services;

use App\Support\Professional;
use Illuminate\Support\Collection;

class ProfessionalRegistry
{
    /**
     * @return Collection<string, Professional>
     */
    public function all(): Collection
    {
        /** @var array<string, array{label?: string, sheet_id?: string, sheet_gid?: string|int|null}> $configured */
        $configured = config('agenda.professionals', []);

        return collect($configured)
            ->map(fn (array $config, string $key) => Professional::fromConfig($key, $config))
            ->filter(fn (Professional $professional) => $professional->sheetId !== '');
    }

    public function find(?string $key): ?Professional
    {
        if ($key === null || $key === '') {
            return null;
        }

        return $this->all()->get($key);
    }

    /**
     * Resolve a profissional pedida, caindo para a padrão (e, em último caso,
     * para a primeira configurada) quando a chave é inválida.
     */
    public function resolve(?string $key): Professional
    {
        $professional = $this->find($key)
            ?? $this->find((string) config('agenda.default'))
            ?? $this->all()->first();

        if (! $professional instanceof Professional) {
            throw new \RuntimeException('Nenhuma profissional configurada em config/agenda.php.');
        }

        return $professional;
    }
}
