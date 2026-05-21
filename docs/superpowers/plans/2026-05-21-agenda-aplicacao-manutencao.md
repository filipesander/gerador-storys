# Agenda — coluna "Aplicação/Manutenção" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ler a coluna "Aplicação ou Manutenção" da planilha e exibi-la na agenda (tela) e no PDF, corrigindo o desalinhamento causado pela coluna ter sido inserida no meio.

**Architecture:** Trocar o parser posicional do `AgendaImporter` por mapeamento baseado no nome do cabeçalho (normalizado sem acento). Adicionar um campo `type` ao value object `Appointment`. Exibir como badge na tela e como coluna "Tipo" (pill colorida) no PDF, substituindo a coluna "Observações" que ficou sem fonte de dados.

**Tech Stack:** Laravel 13, PHP 8.4, value object `Appointment` (readonly), Inertia v3 + React 19, DomPDF (blade), Pest 4.

---

### Task 1: Parser por cabeçalho + campo `type`

**Files:**
- Modify: `app/Support/Appointment.php`
- Modify: `app/Services/AgendaImporter.php`
- Modify (test): `tests/Unit/AgendaImporterTest.php`

- [ ] **Step 1: Escrever o teste que falha (novo layout da planilha)**

Adicionar este novo teste ao final de `tests/Unit/AgendaImporterTest.php` (manter o teste existente):

```php
it('mapeia colunas pelo cabeçalho e lê Aplicação/Manutenção mesmo inserida no meio', function () {
    $csv = implode("\n", [
        '"Data","Horário","Tempo do serviço","Clientes","Serviço ","Status","Aplicação ou Manutenção","Clientes interessadas"',
        '"21/05/2026","08:00","1:30:00","Virna Santana","Volume Inglês 5D","Confirmado","Aplicação","Bia"',
        '"22/05/2026","13:30","2:00:00","Jhessy","Brasileiro","A confirmar","Manutenção",""',
        '"lixo","x","","","","","",""',
    ]);

    $appointments = (new AgendaImporter)->parse($csv);

    expect($appointments)->toHaveCount(2);

    $virna = $appointments->firstWhere('client', 'Virna Santana');
    expect($virna->type)->toBe('Aplicação')
        ->and($virna->service)->toBe('Volume Inglês 5D') // lido apesar do espaço em "Serviço "
        ->and($virna->interested)->toBe('Bia')
        ->and($virna->notes)->toBe(''); // não há coluna "Observações"

    $jhessy = $appointments->firstWhere('client', 'Jhessy');
    expect($jhessy->type)->toBe('Manutenção');
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `php artisan test --compact tests/Unit/AgendaImporterTest.php`
Expected: FALHA — `Appointment` ainda não tem a propriedade `type` (erro de propriedade indefinida) e o parser ainda é posicional.

- [ ] **Step 3: Adicionar `type` ao value object `Appointment`**

Em `app/Support/Appointment.php`, no construtor, adicionar `type` após `status`, e a chave no `toArray()`. Resultado completo do arquivo:

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
        public string $type,
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
            'type' => $this->type,
            'notes' => $this->notes,
            'interested' => $this->interested,
        ];
    }
}
```

- [ ] **Step 4: Reescrever o parser para mapear por cabeçalho**

Em `app/Services/AgendaImporter.php`, adicionar `use Illuminate\Support\Str;` no topo (após os outros `use`) e substituir o método `parse()` por:

```php
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
```

Manter os métodos `parseDate`, `durationToMinutes`, `addMinutes` como estão.

- [ ] **Step 5: Rodar os testes e confirmar que passam**

Run: `php artisan test --compact tests/Unit/AgendaImporterTest.php`
Expected: PASS — ambos os testes (o antigo, com "Observações", e o novo, com "Aplicação ou Manutenção"). O antigo passa porque o mapeamento por nome lê `observacoes`→notes e `clientes interessadas`→interested independom da posição.

- [ ] **Step 6: Pint + commit**

```bash
vendor/bin/pint --dirty --format agent
git add app/Support/Appointment.php app/Services/AgendaImporter.php tests/Unit/AgendaImporterTest.php
git commit -m "feat: agenda lê coluna Aplicação/Manutenção por cabeçalho"
```

---

### Task 2: Badge "Aplicação/Manutenção" na tela

**Files:**
- Modify: `resources/js/pages/agenda/index.tsx`

- [ ] **Step 1: Adicionar `type` ao tipo TS `Appointment`**

Em `resources/js/pages/agenda/index.tsx`, no `type Appointment = { ... }`, adicionar o campo `type` após `status`:

```tsx
type Appointment = {
    date: string;
    date_label: string;
    time: string;
    duration_minutes: number;
    end_time: string;
    client: string;
    service: string;
    status: string;
    type: string;
    notes: string;
    interested: string;
};
```

- [ ] **Step 2: Adicionar a função `typeClasses`**

Logo após a função `statusClasses` existente, adicionar:

```tsx
function typeClasses(type: string): string {
    const t = type.toLowerCase();

    if (t.includes('aplica')) {
        return 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300';
    }

    if (t.includes('manuten')) {
        return 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300';
    }

    return 'bg-muted text-muted-foreground';
}
```

- [ ] **Step 3: Renderizar o badge ao lado do serviço**

No `AppointmentList`, substituir o bloco do serviço:

```tsx
                                    {a.service && (
                                        <p className="text-sm text-muted-foreground">{a.service}</p>
                                    )}
```

por:

```tsx
                                    {(a.service || a.type) && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            {a.service && (
                                                <p className="text-sm text-muted-foreground">{a.service}</p>
                                            )}
                                            {a.type && (
                                                <span
                                                    className={cn(
                                                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                                                        typeClasses(a.type),
                                                    )}
                                                >
                                                    {a.type}
                                                </span>
                                            )}
                                        </div>
                                    )}
```

(`cn` já está importado no arquivo.)

- [ ] **Step 4: Build para validar TypeScript**

Run: `npm run build`
Expected: build conclui sem erros de TypeScript.

- [ ] **Step 5: Commit**

```bash
git add resources/js/pages/agenda/index.tsx
git commit -m "feat: badge Aplicação/Manutenção na agenda"
```

---

### Task 3: Coluna "Tipo" no PDF exportado

**Files:**
- Modify: `resources/views/pdf/agenda.blade.php`

- [ ] **Step 1: Adicionar as classes de pill no CSS**

Em `resources/views/pdf/agenda.blade.php`, logo após a regra `.pill-neutral { ... }` (linha ~63), adicionar:

```css
        .pill-aplic { background-color: #ede9fe; color: #6d28d9; }
        .pill-manut { background-color: #e0f2fe; color: #0369a1; }
```

- [ ] **Step 2: Trocar o cabeçalho "Observações" por "Tipo"**

Substituir:

```blade
                        <th>Observações</th>
```

por:

```blade
                        <th style="width: 120px;">Tipo</th>
```

- [ ] **Step 3: Trocar a célula de notes por uma pill de tipo**

Substituir:

```blade
                            <td class="muted">{{ $a->notes }}</td>
```

por:

```blade
                            <td>
                                @if ($a->type !== '')
                                    @php($t = mb_strtolower($a->type))
                                    <span class="pill {{ str_contains($t, 'aplica') ? 'pill-aplic' : (str_contains($t, 'manuten') ? 'pill-manut' : 'pill-neutral') }}">
                                        {{ $a->type }}
                                    </span>
                                @endif
                            </td>
```

- [ ] **Step 4: Verificar que o PDF gera sem erro**

Run: `php artisan test --compact tests/Feature/AgendaPageTest.php`
Expected: PASS (a página/rotas da agenda continuam funcionando). Se o teste de feature não cobrir o export, validar manualmente baixando o PDF em `/agenda/exportar?period=dia&date=YYYY-MM-DD` (a coluna deve mostrar "Tipo").

- [ ] **Step 5: Commit**

```bash
git add resources/views/pdf/agenda.blade.php
git commit -m "feat: coluna Tipo (Aplicação/Manutenção) no PDF da agenda"
```

---

### Task 4: Verificação final

**Files:** nenhum (verificação)

- [ ] **Step 1: Pint**

Run: `vendor/bin/pint --dirty --format agent`
Expected: `{"tool":"pint","result":"passed"}`.

- [ ] **Step 2: Testes da agenda**

Run: `php artisan test --compact tests/Unit/AgendaImporterTest.php tests/Feature/AgendaPageTest.php`
Expected: todos PASS.

- [ ] **Step 3: Build do frontend**

Run: `npm run build`
Expected: build sem erros.

- [ ] **Step 4: Verificação visual manual (gate)**

Com o dev server rodando (`composer run dev`), abrir `/agenda`:
- Quando a planilha tiver "Aplicação"/"Manutenção" preenchido, o badge colorido aparece ao lado do serviço (vazio → não aparece).
- "Exportar PDF": a coluna passou a ser "Tipo" com a pill colorida.

---

## Notas de execução

- **Retrocompatibilidade:** o parser por cabeçalho mantém o teste antigo verde (mapeia "Observações" e "Clientes interessadas" pelo nome).
- **Coluna vazia:** nas linhas atuais da planilha a coluna nova está vazia; o recurso só aparece visualmente quando a Thay preencher. Os testes cobrem o caminho preenchido.
- **Política de commit:** o usuário pediu para não commitar antes da aprovação. Confirmar antes de executar os `git commit` (ou agrupar num commit final após revisão). Já há mudanças não commitadas de outra frente no working tree — separar os commits por assunto.
