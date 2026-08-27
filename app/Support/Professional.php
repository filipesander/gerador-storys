<?php

namespace App\Support;

use Illuminate\Contracts\Support\Arrayable;

/**
 * Uma profissional da agenda e a planilha do Google que alimenta os horários.
 *
 * @implements Arrayable<string, string>
 */
final readonly class Professional implements Arrayable
{
    public function __construct(
        public string $key,
        public string $label,
        public string $sheetId,
        public ?string $sheetGid = null,
    ) {}

    /**
     * @param  array{label?: string, sheet_id?: string, sheet_gid?: string|int|null}  $config
     */
    public static function fromConfig(string $key, array $config): self
    {
        $gid = $config['sheet_gid'] ?? null;

        return new self(
            key: $key,
            label: (string) ($config['label'] ?? ucfirst($key)),
            sheetId: (string) ($config['sheet_id'] ?? ''),
            sheetGid: ($gid === null || $gid === '') ? null : (string) $gid,
        );
    }

    /**
     * Payload enviado ao front — a planilha nunca é exposta ao client.
     *
     * @return array{key: string, label: string}
     */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'label' => $this->label,
        ];
    }
}
