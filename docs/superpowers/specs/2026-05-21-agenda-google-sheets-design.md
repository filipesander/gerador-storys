# Agenda (Google Sheets) + Exportação PDF — Design

**Data:** 2026-05-21
**Status:** Aprovado para planejamento
**Stack:** Laravel 13 · Inertia v3 · React 19 · Tailwind v4 · barryvdh/laravel-dompdf (nova dep aprovada)

## Contexto e objetivo

A agenda do estúdio da Stephanie vive numa planilha do Google (aba "Agendamento"). Hoje ela
consulta lá fora. Vamos trazer a agenda **para dentro do app** (menu "Agenda", no lugar do
Dashboard), com visualização por **dia/semana** e **exportação em PDF** do período escolhido.

A planilha é **legível sem autenticação** via endpoint CSV do Google (link-shared). Confirmado:
`https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&gid=<GID>` → HTTP 200, `text/csv`.

**Colunas reais da aba "Agendamento":**
`Data` (dd/mm/aaaa) · `Horário` (HH:MM) · `Tempo do serviço` (h:mm:ss) · `Clientes` (nome) ·
`Serviço` · `Status` (Confirmado | A confirmar) · `Observações` · `Clientes interessadas`
(+ colunas vazias à direita, ignoradas).

## Escopo

Incluído:
1. Ingestão da planilha via endpoint CSV (sem Google API/credenciais).
2. Página **Agenda** (substitui Dashboard) com toggle **Dia/Semana** e navegação de data.
3. **Exportação PDF** do período (dia/semana) com todas as informações.
4. Substituição do Dashboard na navegação e no redirect pós-login.

Fora do escopo:
- Editar a planilha de volta (somente leitura).
- Google Sheets API / OAuth (desnecessário — CSV público).
- Outros formatos de export (só PDF nesta versão).

## Decisões de arquitetura

### Acesso aos dados — fetch do CSV (sem credenciais)
O backend faz `Http::get()` no endpoint CSV. ID e GID em config/env
(`AGENDA_SHEET_ID`, `AGENDA_SHEET_GID`), default = os valores fornecidos. **Cache ~60s**
(`Cache::remember`) sobre o CSV cru; botão "Atualizar" busta o cache (`?refresh=1`).

### Ingestão — `App\Services\AgendaImporter`
- `fetch(): string` — busca o CSV (com cache), respeitando `refresh`.
- `parse(string $csv): Collection<Appointment>` — parseia linhas, pula cabeçalho e linhas
  vazias, normaliza data (`dd/mm/aaaa` → `Carbon`), hora, duração (`h:mm:ss` → minutos),
  status, e monta DTOs. Pura e testável (sem rede).
- Helpers de filtro por período: `forDay(date)`, `forWeek(date)` (semana seg–dom).

### DTO — `App\Support\Appointment` (readonly)
Campos: `date` (Carbon), `time` (string `HH:MM`), `durationMinutes` (int), `endTime`
(string `HH:MM`, calculado), `client`, `service`, `status` (string), `notes`, `interested`.
Serializável para o front (toArray / Arrayable).

### Backend — controller e rotas
- `AgendaController@index` (Inertia `agenda/index`): recebe `period` (dia|semana, default dia)
  e `date` (default hoje); passa os appointments do período como **deferred prop** do Inertia v3
  (skeleton enquanto carrega), além de `period`, `date`, e intervalo.
- `AgendaController@export`: `period` + `date` → PDF (dompdf) do período. Download.
- Rotas em `auth,verified`: `agenda` (GET) e `agenda.exportar` (GET).

### Substituição do Dashboard
- Nav: item "Dashboard" → **"Agenda"** (ícone `CalendarDays`).
- Redirect pós-login → `/agenda` (ajustar `config/fortify.php` `home` / provider).
- **Reaproveitar** a rota/teste do dashboard para a agenda (não deletar testes — ajustar
  `DashboardTest`→agenda e os asserts de redirect em `AuthenticationTest`/`RegistrationTest`).
- A página `dashboard.tsx` e a rota `dashboard` são removidas/substituídas pela agenda.

### Frontend — `pages/agenda/index.tsx`
- **Toggle Dia/Semana** (ToggleGroup) + navegação de data (anterior / hoje / próximo + date input).
- Agendamentos em **cards agrupados por dia**: hora + hora de término (calc. pela duração),
  cliente, serviço, duração, **badge de status** (Confirmado=verde, A confirmar=âmbar),
  observações; "interessadas" quando houver.
- Estados: **carregando (skeleton pulsante)**, **vazio** ("Nenhum agendamento"),
  **erro** (falha no fetch) com botão "Tentar de novo". Botão "Atualizar". Identidade roxa.
- Botão **"Exportar PDF"** → abre `agenda.exportar` com o período/data atuais.

### Exportação PDF — `resources/views/pdf/agenda.blade.php`
- dompdf renderiza um Blade: cabeçalho branded **"Stephanie · Agenda"** + intervalo de datas,
  **tabela com todas as colunas**, agrupada por dia. UTF-8 (acentos) com fonte adequada.
- Nome do arquivo: `agenda-<dia|semana>-<aaaa-mm-dd>.pdf`.

## Inventário de arquivos

| Arquivo | Mudança |
|---|---|
| `config/agenda.php` (criar) | `sheet_id`, `sheet_gid` via env. |
| `.env`, `.env.example` | `AGENDA_SHEET_ID=...`, `AGENDA_SHEET_GID=614191594`. |
| `app/Support/Appointment.php` (criar) | DTO readonly + `toArray`. |
| `app/Services/AgendaImporter.php` (criar) | fetch + parse + cache + filtros de período. |
| `app/Http/Controllers/AgendaController.php` (criar) | `index` (Inertia, deferred) + `export` (PDF). |
| `routes/web.php` | rotas `agenda` e `agenda.exportar`; remover `dashboard`. |
| `config/fortify.php` (ou provider) | redirect pós-login → `/agenda`. |
| `resources/js/pages/agenda/index.tsx` (criar) | UI da agenda (dia/semana, cards, estados). |
| `resources/js/components/app-sidebar.tsx` | nav "Agenda" no lugar de "Dashboard". |
| `resources/js/pages/dashboard.tsx` (remover) | substituída pela agenda. |
| `resources/views/pdf/agenda.blade.php` (criar) | template do PDF. |
| `tests/Unit/AgendaImporterTest.php` (criar) | parse do CSV. |
| `tests/Feature/AgendaPageTest.php` (criar/repurpose) | auth + render + export (Http::fake). |
| `tests/Feature/Auth/*`, `DashboardTest` | ajustar asserts de redirect/rota. |

## Estratégia de testes

- **Unit `AgendaImporter`:** dado um CSV fixo (fixture com o cabeçalho real + algumas linhas,
  incluindo data inválida/linha vazia), `parse()` retorna os appointments corretos: data
  parseada, duração `1:30:00`→90min, `endTime` calculado, status preservado, linhas vazias
  ignoradas, agrupamento por dia. Sem rede.
- **Feature:** `Http::fake([gviz => Http::response($csvFixture, 200)])`; `/agenda` exige auth e
  renderiza `agenda/index`; com `period=semana` agrupa a semana; `export` retorna
  `Content-Type: application/pdf` e status 200.
- **Auth:** atualizar `AuthenticationTest`/`RegistrationTest` para redirect → `route('agenda')`;
  repurpose `DashboardTest` → agenda.
- Gates: `pint`, `lint`, `types:check`, `build`, `php artisan test tests/Feature tests/Unit`.

## Riscos / atenção

- **Disponibilidade da planilha:** depende de continuar link-shared (qualquer um com link vê).
  Se mudar pra privada, o fetch falha → tratar com estado de erro + cache do último bom (V1:
  estado de erro com retry; cache de 60s ameniza).
- **Datas/fuso:** parse `dd/mm/aaaa`; usar timezone do app; "hoje" no fuso local.
- **Duração `0:00:00`** (ex.: Caroline Dias) → 0 min, `endTime` = hora de início.
- **dompdf + acentos:** garantir UTF-8 e fonte com suporte (DejaVu Sans, default do dompdf).
- **Performance:** planilha pequena; fetch+parse de tudo e filtra em memória é suficiente.
- Só uma dependência nova: `barryvdh/laravel-dompdf`.
