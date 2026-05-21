# Gerador de Stories — Design (V1)

**Data:** 2026-05-21
**Status:** Aprovado para planejamento
**Stack:** Laravel 13 · Inertia v3 · React 19 · Tailwind v4 · shadcn/Radix (Laravel React Starter Kit)

## Contexto e problema

Ferramenta interna para a recepção/agenda de um salão de beleza. Hoje, a usuária abre o
Canva e monta manualmente os stories de "horários vagos" para o Instagram. A ferramenta
automatiza isso: ela preenche os horários disponíveis, escolhe um template, vê o preview
em tempo real e baixa a PNG pronta para postar.

Referência visual: story vertical em tons de lavanda, título "Horários da Semana" em serifa
elegante, cartões por dia da semana (badge com o dia + horários), com decorações florais.

## Escopo do V1

Incluído:
- Acesso **atrás de login** (reaproveita o auth do Starter Kit / Fortify).
- Gerador **stateless** — nenhum dado de story é persistido (sem models/migrations novas).
- Dois modos de conteúdo: **Semana** (vários dias, cada um com seus horários) e **Dia** avulso.
- **Biblioteca de templates data-driven** com estilos visuais distintos (V1: ~5).
- **Preview em tempo real** (WYSIWYG — o preview é o próprio arquivo exportado).
- **Download de PNG** no formato story (1080×1920).
- Visuais 100% gerados por código (CSS/SVG) — sem assets externos.
- Story limpo, **sem marca do salão** (só título + horários), como na referência.

Fora do escopo (fases futuras):
- Envio pelo WhatsApp. Caminho preferido para depois: **Web Share API** (compartilhar nativo
  no celular com a PNG anexada — menor atrito, sem API paga).
- Cadastro de clientes / histórico de stories / escalas reutilizáveis.
- Branding configurável (nome/@ do salão no story).

## Decisões de arquitetura

### Geração da imagem — client-side (Abordagem A, aprovada)

O story é um componente React renderizado no navegador. O download captura esse nó DOM
como PNG via **`html-to-image`** (dependência nova aprovada), em tamanho fixo 1080×1920.

- **Por quê:** WYSIWYG real (preview === arquivo), zero infra de servidor, instantâneo.
- Alternativas descartadas: servidor com navegador headless (Browsershot/Puppeteer — infra
  pesada demais p/ ferramenta interna); composição em PHP GD/Imagick (duplicaria a lógica de
  layout e não bateria com o preview).

### Fluxo

```
Formulário (estado React) ──► StoryCanvas (1080×1920) ──► preview escalado (transform: scale)
                                      │
                                      └──► html-to-image.toPng ──► download .png
```

O **mesmo** `StoryCanvas` serve preview e exportação. O preview é escalado para caber na tela;
a exportação renderiza uma instância em **tamanho real (1080×1920) num container oculto** e
captura essa, para o scale do preview nunca interferir no arquivo final.

### Backend

- Uma rota Inertia, sem controller (stateless):
  `Route::inertia('horarios', 'stories/index')->name('stories.index')` dentro do grupo
  `['auth','verified']` (igual ao `dashboard`).
- Item novo na sidebar: "Gerador de Stories".
- Configs de template vivem no front (TS); o backend não precisa enviá-las.

## Modelo de dados (estado de frontend, sem persistência)

```ts
type StoryMode = 'semana' | 'dia';

type DaySlot = {
  weekday: string;     // ex: 'terca' — só dias COM vaga entram na lista
  times: string[];     // ex: ['08:00', '14:00']
};

type StoryData = {
  mode: StoryMode;
  title: string;       // default 'Horários da Semana' (semana) / 'Horários de <Dia>' (dia)
  weekSlots: DaySlot[];// modo semana: usuária adiciona/remove linhas de dia
  date: string;        // modo dia (ISO)
  dayTimes: string[];  // modo dia
};
```

- **Modo semana:** só os dias com vaga aparecem (a referência pula domingo/segunda).
- **Modo dia:** uma data + lista de horários.

## Sistema de templates (data-driven)

Cada template é uma config consumida por um único renderer. Adicionar estilo = adicionar um
objeto ao registry.

```ts
type TemplateTheme = {
  id: string;
  name: string;
  background: string;                       // CSS gradient/cor de fundo
  decoration: 'floral' | 'folhas' | 'none'; // chave da camada SVG decorativa
  fonts: { display: string; body: string };
  palette: {
    title: string; cardBg: string; cardBorder: string;
    badgeBg: string; badgeText: string; timeText: string;
  };
};
```

Estilos iniciais do V1 (~5, ajustáveis na implementação):
1. **Lavanda Floral** — fiel à referência (lavanda + florais vetoriais + serifa).
2. **Minimal Clean** — fundo claro, sem decoração, tipografia protagonista.
3. **Dark Elegante** — fundo escuro, contraste alto, acento dourado/claro.
4. **Nude / Bege** — paleta quente e suave, decoração de folhas.
5. **Gradiente Vibrante** — fundo em gradiente saturado, cartões translúcidos.

Picker exibe **miniaturas** (mini-render do próprio `StoryCanvas` em escala reduzida).

**Fontes:** display serif elegante (ex. Playfair Display / Cormorant) + sans limpa
(ex. Poppins), carregadas via CSS. **Detalhe crítico:** aguardar `document.fonts.ready`
antes de capturar — senão a PNG sai com fonte de fallback.

## UI da página (`pages/stories/index.tsx`)

Layout em 2 painéis, responsivo (empilha no mobile):

- **Esquerda — controles:**
  - Toggle Semana / Dia.
  - Campo de título (com default por modo).
  - Editor de dias/horários: adicionar/remover dia (modo semana) ou horários (modo dia).
  - Grade de miniaturas de template (seleção).
- **Direita — preview:**
  - Moldura de celular com o `StoryCanvas` escalado, atualizando em tempo real.
  - Botão **Baixar PNG**.

## Exportação PNG

```ts
await document.fonts.ready;
const dataUrl = await htmlToImage.toPng(fullSizeNode, {
  width: 1080, height: 1920, pixelRatio: 1, cacheBust: true,
});
// trigger de download: horarios-<YYYY-MM-DD>.png
```

`fullSizeNode` = a instância de `StoryCanvas` em tamanho real, renderizada num container
oculto (`position: fixed; left: -99999px`).

## Componentes / arquivos

```
resources/js/pages/stories/index.tsx          # composição: form + preview + download
resources/js/components/stories/
  story-canvas.tsx                             # renderer 1080×1920 (preview + export)
  day-card.tsx                                 # cartão de um dia (badge + horários)
  template-picker.tsx                          # grade de miniaturas
  story-form.tsx                               # controles do formulário
  decorations/                                 # camadas SVG (floral, folhas, ...)
resources/js/lib/stories/
  templates.ts                                 # tipos + registry de TemplateTheme
  story-data.ts                                # tipos, defaults e helpers (ex: parseTimes)
  export-png.ts                                # wrapper de html-to-image + download
routes/web.php                                 # + rota stories.index
tests/Feature/StoriesPageTest.php
tests/Browser/StoryGeneratorTest.php
```

### Princípios de fronteira

- `StoryCanvas` é a única unidade que conhece o layout pixel-a-pixel; recebe `(template, data)`
  e não sabe nada sobre o formulário.
- Templates são dados, não código: o registry não tem lógica de render.
- `export-png.ts` isola a lib de captura — trocar `html-to-image` por outra não toca a UI.

## Estratégia de testes

- **Pest feature** (`StoriesPageTest`): deslogado → redireciona para login; logado → 200 e
  renderiza o componente Inertia `stories/index`.
- **Pest 4 browser** (`StoryGeneratorTest`): visita a página logada, preenche horários,
  escolhe um template, **assert** que o preview contém os horários digitados; smoke test
  (sem erros de console).
- Helpers puros (parse de horários, defaults) ficam pequenos e cobertos pelo teste de browser.
  Não adicionamos runner JS (vitest) no V1; pode entrar depois se a lógica crescer.

## Riscos / pontos de atenção

- **Embedding de fontes** no `html-to-image`: garantir `document.fonts.ready` e, se preciso,
  inlining do CSS de fonte, para a PNG não sair com fallback.
- **Tamanho fixo vs preview escalado:** capturar sempre o nó em 1080×1920 (oculto), nunca o
  preview escalado.
- **Dependência nova:** `html-to-image` (aprovada). Nenhuma outra dependência será adicionada.
