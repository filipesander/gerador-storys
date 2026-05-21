# Agenda — coluna "Aplicação ou Manutenção"

**Data:** 2026-05-21
**Status:** Aprovado (design)

## Problema

A planilha do Google Sheets que alimenta a agenda ganhou uma coluna nova,
**"Aplicação ou Manutenção"**, inserida na **posição 6** (entre "Status" e "Clientes
interessadas"). O `AgendaImporter::parse()` lê o CSV por **posição fixa de coluna**, então:

- `row[6]` (que o código trata como `notes`/Observações) agora aponta para "Aplicação ou
  Manutenção" — o sistema está lendo a coluna errada.
- A planilha atual tem 8 colunas e **não possui mais** coluna "Observações".

Layout atual da planilha (verificado ao vivo):

```
[0] Data  [1] Horário  [2] Tempo do serviço  [3] Clientes  [4] Serviço
[5] Status  [6] Aplicação ou Manutenção  [7] Clientes interessadas
```

Objetivo: ler corretamente a coluna nova e exibi-la **no sistema (tela)** e **no PDF
exportado**.

## Solução

### 1. Parser baseado em cabeçalho (`app/Services/AgendaImporter.php`)

Trocar a leitura posicional por mapeamento **nome do cabeçalho → índice**:

- Ler a 1ª linha como cabeçalho. Para cada coluna, normalizar o título (trim, minúsculas,
  remover acentos) e guardar `nomeNormalizado => índice`.
- Para cada linha de dados, buscar os valores pelos nomes esperados:

  | Campo Appointment | Cabeçalho esperado (normalizado) |
  |---|---|
  | date | `data` |
  | time | `horario` |
  | duration | `tempo do servico` |
  | client | `clientes` |
  | service | `servico` (ignora o espaço de "Serviço ") |
  | status | `status` |
  | type (NOVO) | `aplicacao ou manutencao` |
  | interested | `clientes interessadas` |
  | notes | `observacoes` |

- Coluna ausente → valor `''` (ex.: `notes` fica vazio enquanto não houver "Observações").
- Mantém o mesmo comportamento de validação (linha sem data válida ou sem hora é ignorada) e
  a ordenação por data+hora.
- Benefício: conserta o desalinhamento atual e fica imune a reordenação de colunas.

### 2. Objeto de valor (`app/Support/Appointment.php`)

- Adicionar propriedade promovida `public string $type` (valor de "Aplicação ou Manutenção").
- Incluir `'type' => $this->type` em `toArray()`.
- `notes` permanece (mapeado de "Observações"; vazio quando a coluna não existe).

### 3. Tela (`resources/js/pages/agenda/index.tsx`)

- Adicionar `type: string` ao tipo TS `Appointment`.
- Renderizar um **badge** ao lado do nome do serviço, **somente quando `a.type` não for vazio**.
- Função `typeClasses(type)` (espelhando `statusClasses`):
  - contém "aplica" → roxo: `bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300`
  - contém "manuten" → azul: `bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300`
  - senão → neutro: `bg-muted text-muted-foreground`
- O badge mostra o texto literal da célula (ex.: "Aplicação", "Manutenção").
- `notes` continua sendo renderizado condicionalmente (não aparece enquanto vazio).

### 4. PDF (`resources/views/pdf/agenda.blade.php`)

- Trocar o cabeçalho da coluna `Observações` por **`Tipo`**.
- Na célula, trocar `{{ $a->notes }}` por uma pill colorida com `$a->type`:
  - "aplica" → `background:#ede9fe; color:#6d28d9`
  - "manuten" → `background:#e0f2fe; color:#0369a1`
  - senão (e não vazio) → cinza neutro `background:#efeaf7; color:#6b7280`
  - vazio → célula vazia (sem pill).
- Reusar a classe `.pill` existente; adicionar `.pill-aplic` e `.pill-manut`.

### 5. Testes (`tests/`)

- Teste Pest unitário/feature de `AgendaImporter::parse()` alimentando um CSV em string com o
  **cabeçalho novo** (incluindo "Serviço " com espaço e a coluna "Aplicação ou Manutenção" na
  posição 6, sem "Observações"). Asserções:
  - `type` lê o valor de "Aplicação ou Manutenção".
  - `service` é lido corretamente apesar do espaço no cabeçalho.
  - `notes` fica `''` quando não há coluna "Observações".
  - `interested` lê "Clientes interessadas".
  - Linha sem data válida é ignorada.
- Sem rede (parse recebe string diretamente).

## Arquivos afetados

- `app/Services/AgendaImporter.php` — parser por cabeçalho + leitura da coluna `type`.
- `app/Support/Appointment.php` — propriedade `type` + `toArray()`.
- `resources/js/pages/agenda/index.tsx` — tipo TS, `typeClasses`, badge.
- `resources/views/pdf/agenda.blade.php` — coluna "Tipo" + pills.
- `tests/Feature/AgendaImporterTest.php` (novo) — teste de parse.

## Fora de escopo

- Editar a planilha ou agendamentos pelo sistema.
- Outras colunas além das mapeadas.
- Mudanças no layout/branding do PDF além da troca de coluna.
