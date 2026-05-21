# Gerador de Stories — Fidelidade do export + layout lilás do salão

**Data:** 2026-05-21
**Status:** Aprovado (design)

## Problema

1. **Alinhamento divergente:** o PNG gerado fica diferente do preview na tela.
2. **Layout:** o salão usa um fundo lilás com arte floral branca (igual ao Canva — ver
   referência `WhatsApp Image 2026-05-21 at 10.29.44.jpeg`) que não está sendo reproduzido.
3. **Paleta:** existem 5 templates, vários fora da identidade do salão (bege, dark dourado,
   gradiente rosa). Só devem existir layouts roxo/lilás.

## Causa raiz do desalinhamento

`resources/css/app.css` carrega as fontes (Playfair Display, Poppins, Cormorant Garamond,
Montserrat) via `@import` do Google Fonts (cross-origin). O export usa `html-to-image`
(`toPng`), que tenta embutir as fontes lendo as `cssRules` das folhas de estilo. Folhas
cross-origin lançam erro de CORS ao acessar `cssRules`, então as fontes são silenciosamente
ignoradas e o PNG é renderizado com **fontes de fallback** — métricas diferentes do preview
(que usa a fonte real já carregada), causando o desalinhamento de título e horários.

## Solução

### 1. Auto-hospedar as fontes (corrige o export)

- Baixar os `.woff2` para `public/fonts/`:
  - **Playfair Display** (700) — usada como display.
  - **Cormorant Garamond** (600) — display da variação "Lavanda Liso".
  - **Poppins** (400, 500, 600) — corpo/badges/horários.
  - Montserrat é descartada (só era usada por template removido).
- Declarar `@font-face` com `url('/fonts/...')` same-origin em `app.css` e **remover** o
  `@import` do Google Fonts.
- Manter os nomes de família (`'Playfair Display'`, `'Poppins'`, `'Cormorant Garamond'`) iguais
  para não mexer em `templates.ts`.
- Resultado: same-origin → `html-to-image` embute as fontes como data URL → PNG idêntico ao
  preview. Sem adicionar dependências npm. Bônus: render mais rápido (sem request externo).

### 2. Asset de fundo (fidelidade ao Canva)

- Copiar o JPEG de referência para `public/storys/lilas-floral.jpg`.
- O template "Lilás Floral" passa a usar `background: url('/storys/lilas-floral.jpg') center / cover`
  em vez de `linear-gradient` + SVG. A arte floral branca dos cantos vem embutida na imagem
  (match exato do Canva).
- `html-to-image` embute a imagem (same-origin, `cacheBust` já ativo) no export.

### 3. Templates: de 5 → 3 (todos roxo/lilás)

Editar `resources/js/lib/stories/templates.ts`. Remover `minimal-clean`, `dark-elegante`,
`nude-bege`, `gradiente-vibrante`. Manter/criar:

| id | nome | background | decoration | display font | título |
|---|---|---|---|---|---|
| `lilas-floral` _(padrão)_ | Lilás Floral | `url('/storys/lilas-floral.jpg') center/cover` | `none` (embutida na imagem) | Playfair Display | `#5d3f96` |
| `lavanda-liso` | Lavanda Liso | gradiente lavanda suave (ex. `linear-gradient(165deg,#d9ccf2,#c3b0e8)`) | `none` | Cormorant Garamond | `#5d3f96` |
| `roxo-profundo` | Roxo Profundo | gradiente roxo escuro (ex. `linear-gradient(160deg,#3a2a63,#5b3f96)`) | `none` | Playfair Display | `#f1e9ff` |

- `DEFAULT_TEMPLATE_ID` → `lilas-floral`.
- Cards: manter o estilo branco translúcido atual (`DayCard`), que contrasta bem nos 3 fundos.
  Em "Roxo Profundo" os textos do card permanecem em roxo escuro sobre card claro.
- O tipo `DecorationKey` e os componentes `FloralDecoration`/`LeavesDecoration` deixam de ser
  usados pelos templates ativos; manter os arquivos (sem remoção) para não ampliar o escopo,
  ou remover se ficarem órfãos — decisão na implementação, sem impacto no usuário.

### 4. Layout do conteúdo

Manter a composição centralizada do `StoryCanvas` (título topo-centro → data opcional →
cards centralizados), que encaixa no centro vazio da referência. Ajustar o padding vertical
para o conteúdo ficar na área limpa, afastado das flores dos cantos
(ex.: `padding: '160px 80px'`). Sem mudança estrutural no componente.

## Arquivos afetados

- `public/fonts/*.woff2` (novo) — fontes auto-hospedadas.
- `public/storys/lilas-floral.jpg` (novo) — asset de fundo.
- `resources/css/app.css` — `@font-face` + remover `@import`.
- `resources/js/lib/stories/templates.ts` — 5→3 templates roxo/lilás.
- `resources/js/components/stories/story-canvas.tsx` — `backgroundImage` quando o template
  define imagem; ajuste de padding.

## Testes

- Teste Pest existente/leve garantindo que a rota `/stories` carrega (`200`).
- Fidelidade do export validada manualmente: baixar o PNG e comparar com o preview (mesmo
  alinhamento de título/horários e mesmo fundo do Canva).
- `npm run build` para confirmar que o bundle gera sem erro com as fontes locais.

## Fora de escopo

- Reescrita do render para `<canvas>` (não necessária; o fix de fontes resolve a fidelidade).
- Editor de cores/decoração dinâmico.
- Mudança nos modos "semana"/"dia" (mantidos como estão).
