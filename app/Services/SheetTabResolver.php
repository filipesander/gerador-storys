<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Descobre em qual aba (gid) de uma planilha do Google estão os agendamentos.
 *
 * O gid que aparece na URL copiada do navegador é só a aba aberta no momento,
 * e quase nunca é a de agendamentos. Quando o gid não está fixado no .env,
 * lemos a lista de abas da planilha e escolhemos a que tem as colunas da
 * agenda (Data, Horário, Clientes).
 */
class SheetTabResolver
{
    /**
     * Colunas que identificam a aba de agendamentos.
     */
    private const REQUIRED_COLUMNS = ['data', 'horario', 'clientes'];

    /**
     * Teto de abas testadas para não disparar requisições demais em planilhas grandes.
     */
    private const MAX_PROBES = 6;

    public function csvUrl(string $sheetId, ?string $gid = null): string
    {
        $url = "https://docs.google.com/spreadsheets/d/{$sheetId}/gviz/tq?tqx=out:csv";

        return $gid === null || $gid === '' ? $url : $url."&gid={$gid}";
    }

    /**
     * Abas da planilha, na ordem em que aparecem no Google Sheets.
     *
     * @return array<int, array{gid: string, name: string}>
     */
    public function tabs(string $sheetId): array
    {
        $html = Http::timeout(15)
            ->get("https://docs.google.com/spreadsheets/d/{$sheetId}/htmlview")
            ->throw()
            ->body();

        preg_match_all('/items\.push\(\{name:\s*"(.*?)"[^}]*?gid:\s*"(\d+)"/', $html, $matches, PREG_SET_ORDER);

        $tabs = [];

        foreach ($matches as $match) {
            $tabs[] = ['gid' => $match[2], 'name' => $this->decodeName($match[1])];
        }

        return $tabs;
    }

    /**
     * gid da aba de agendamentos, ou null quando a planilha não pôde ser lida
     * ou nenhuma aba tem as colunas esperadas.
     */
    public function resolveAgendaGid(string $sheetId, bool $refresh = false): ?string
    {
        $cacheKey = "agenda.tab.{$sheetId}";

        if ($refresh) {
            Cache::forget($cacheKey);
        }

        $cached = Cache::get($cacheKey);

        if (is_string($cached)) {
            return $cached;
        }

        $gid = $this->discoverAgendaGid($sheetId);

        if ($gid !== null) {
            Cache::put($cacheKey, $gid, (int) config('agenda.tab_cache_seconds', 86400));
        }

        return $gid;
    }

    /**
     * O CSV tem as colunas de uma agenda?
     */
    public function isAgendaCsv(string $csv): bool
    {
        $firstLine = strtok(ltrim($csv), "\r\n");

        if ($firstLine === false) {
            return false;
        }

        $headers = array_map(
            fn (?string $header) => self::normalizeHeader((string) $header),
            str_getcsv($firstLine, separator: ',', enclosure: '"', escape: '')
        );

        foreach (self::REQUIRED_COLUMNS as $column) {
            if (! in_array($column, $headers, strict: true)) {
                return false;
            }
        }

        return true;
    }

    public static function normalizeHeader(string $value): string
    {
        return Str::ascii(trim(mb_strtolower($value)));
    }

    private function discoverAgendaGid(string $sheetId): ?string
    {
        try {
            $tabs = $this->tabs($sheetId);
        } catch (\Throwable) {
            return null;
        }

        foreach ($this->orderCandidates($tabs) as $tab) {
            try {
                $csv = Http::timeout(15)->get($this->csvUrl($sheetId, $tab['gid']))->throw()->body();
            } catch (\Throwable) {
                continue;
            }

            if ($this->isAgendaCsv($csv)) {
                return $tab['gid'];
            }
        }

        return null;
    }

    /**
     * Abas cujo nome lembra "agenda"/"agendamento" são testadas primeiro.
     *
     * @param  array<int, array{gid: string, name: string}>  $tabs
     * @return array<int, array{gid: string, name: string}>
     */
    private function orderCandidates(array $tabs): array
    {
        $named = [];
        $others = [];

        foreach ($tabs as $tab) {
            if (str_contains(self::normalizeHeader($tab['name']), 'agend')) {
                $named[] = $tab;
            } else {
                $others[] = $tab;
            }
        }

        return array_slice([...$named, ...$others], 0, self::MAX_PROBES);
    }

    /**
     * O HTML do Google escapa os nomes das abas como literais JS (\x3d, ç, \/).
     */
    private function decodeName(string $raw): string
    {
        $normalized = preg_replace('/\\x([0-9a-fA-F]{2})/', '\u00$1', $raw) ?? $raw;

        $decoded = json_decode('"'.$normalized.'"');

        return is_string($decoded) ? $decoded : $raw;
    }
}
