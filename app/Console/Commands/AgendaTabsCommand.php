<?php

namespace App\Console\Commands;

use App\Services\ProfessionalRegistry;
use App\Services\SheetTabResolver;
use App\Support\Professional;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class AgendaTabsCommand extends Command
{
    protected $signature = 'agenda:tabs {professional? : Chave da profissional (ex.: thay, gaby, mika)}';

    protected $description = 'Lista as abas das planilhas da agenda e mostra qual delas tem os agendamentos';

    public function handle(ProfessionalRegistry $registry, SheetTabResolver $resolver): int
    {
        $requested = $this->argument('professional');

        $professionals = $requested === null
            ? $registry->all()
            : collect([$registry->find($requested)])->filter();

        if ($professionals->isEmpty()) {
            $this->components->error("Profissional [{$requested}] não está configurada em config/agenda.php.");

            return self::FAILURE;
        }

        $failed = false;

        foreach ($professionals as $professional) {
            $this->newLine();
            $this->components->info("{$professional->label} ({$professional->key}) — planilha {$professional->sheetId}");

            $failed = ! $this->showTabs($resolver, $professional) || $failed;
        }

        $this->newLine();

        return $failed ? self::FAILURE : self::SUCCESS;
    }

    private function showTabs(SheetTabResolver $resolver, Professional $professional): bool
    {
        try {
            $tabs = $resolver->tabs($professional->sheetId);
        } catch (\Throwable $e) {
            $this->components->error('Não consegui ler a planilha. Ela precisa estar compartilhada como "qualquer pessoa com o link pode ver".');
            $this->components->bulletList([Str::limit(trim(Str::before($e->getMessage(), ':')), 120)]);

            return false;
        }

        $rows = [];

        foreach ($tabs as $tab) {
            $rows[] = [
                $tab['gid'],
                $tab['name'],
                $this->tabKind($resolver, $professional, $tab['gid']),
            ];
        }

        $this->table(['gid', 'Aba', 'Conteúdo'], $rows);

        $agenda = collect($rows)->firstWhere(2, 'agendamentos ✔');

        if ($agenda === null) {
            $this->components->warn('Nenhuma aba com as colunas Data, Horário e Clientes.');

            return false;
        }

        $env = 'AGENDA_'.mb_strtoupper($professional->key).'_SHEET_GID';
        $this->components->success("Fixe no .env, se quiser evitar a descoberta automática: {$env}={$agenda[0]}");

        return true;
    }

    private function tabKind(SheetTabResolver $resolver, Professional $professional, string $gid): string
    {
        try {
            $csv = Http::timeout(15)->get($resolver->csvUrl($professional->sheetId, $gid))->throw()->body();
        } catch (\Throwable) {
            return 'não foi possível ler';
        }

        return $resolver->isAgendaCsv($csv) ? 'agendamentos ✔' : 'outro';
    }
}
