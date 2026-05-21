# Gerador de Stories — Layout lilás + fidelidade do export — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o PNG gerado ficar idêntico ao preview, usar o fundo lilás floral do Canva e reduzir os templates para 3 variações roxo/lilás.

**Architecture:** A divergência preview≠PNG vem das fontes Google carregadas via `@import` cross-origin, que o `html-to-image` não consegue embutir (CORS). Auto-hospedando os `.woff2` (same-origin) o export passa a embutir as fontes e fica fiel. O fundo do Canva entra como imagem em `public/`, e `templates.ts` é reduzido a 3 temas roxo/lilás. Nenhuma dependência npm nova.

**Tech Stack:** Laravel 13 + Inertia v3 + React 19 + Tailwind v4 (Vite), `html-to-image` para export, Pest 4 para testes.

---

### Task 1: Auto-hospedar as fontes (corrige preview ≠ PNG)

**Files:**
- Create: `public/fonts/*.woff2` (gerados pelo script)
- Modify: `resources/css/app.css:1` (remover `@import` Google + inserir `@font-face` locais)

- [ ] **Step 1: Baixar os woff2 e localizar a CSS de fontes**

Run (na raiz do projeto):

```bash
mkdir -p public/fonts public/storys
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
curl -sL -A "$UA" "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Playfair+Display:wght@700&family=Poppins:wght@400;500;600&display=swap" -o /tmp/gf.css
cp /tmp/gf.css /tmp/gf-local.css
for url in $(grep -oE "https://fonts.gstatic.com/[^)]+\.woff2" /tmp/gf.css | sort -u); do
  fname=$(basename "$url")
  curl -sL "$url" -o "public/fonts/$fname"
  python3 - "$url" "$fname" <<'PY'
import sys
url, fname = sys.argv[1], sys.argv[2]
p = "/tmp/gf-local.css"
open(p, "w").write(open(p).read().replace(url, "/fonts/" + fname))
PY
done
echo "--- woff2 baixados ---"; ls -1 public/fonts/
```

Expected: pasta `public/fonts/` com vários `.woff2`; `/tmp/gf-local.css` com `url(/fonts/...woff2)` em vez de `https://fonts.gstatic.com/...`.

- [ ] **Step 2: Substituir o `@import` Google por `@font-face` same-origin no app.css**

Run:

```bash
python3 - <<'PY'
css_path = "resources/css/app.css"
local_fonts = open("/tmp/gf-local.css").read().strip()
lines = open(css_path).read().splitlines()
# remove a linha do @import Google Fonts
lines = [l for l in lines if "fonts.googleapis.com" not in l]
out, inserted = [], False
for l in lines:
    out.append(l)
    if not inserted and "tw-animate-css" in l:
        out += ["", "/* Fontes auto-hospedadas (same-origin para o html-to-image embutir no PNG) */", local_fonts]
        inserted = True
open(css_path, "w").write("\n".join(out) + "\n")
print("OK" if inserted else "FALHOU: ancora tw-animate-css nao encontrada")
PY
```

Expected: imprime `OK`. `resources/css/app.css` não tem mais `fonts.googleapis.com`; tem um bloco `@font-face` com `url(/fonts/...woff2)` logo após `@import 'tw-animate-css';`. As famílias continuam `'Playfair Display'`, `'Poppins'`, `'Cormorant Garamond'` (não mexer em `templates.ts`).

- [ ] **Step 3: Confirmar que o `@import 'tailwindcss'` ainda vem antes de qualquer regra**

Run: `head -10 resources/css/app.css`
Expected: as primeiras linhas não-vazias são `@import 'tailwindcss';` e `@import 'tw-animate-css';` (regras `@import` antes de qualquer `@font-face`/`@source`). Se houver `@font-face` antes de algum `@import`, mover o bloco para depois do último `@import`.

- [ ] **Step 4: Build para validar o CSS**

Run: `npm run build`
Expected: build conclui sem erro; nenhum aviso de `@import must precede`.

- [ ] **Step 5: Commit**

```bash
git add public/fonts resources/css/app.css
git commit -m "fix: auto-hospeda fontes para PNG sair igual ao preview"
```

---

### Task 2: Adicionar o fundo lilás floral do Canva como asset

**Files:**
- Create: `public/storys/lilas-floral.jpg`

- [ ] **Step 1: Copiar a imagem de referência para public/**

Run:

```bash
cp "/mnt/c/Users/Filipe/Downloads/WhatsApp Image 2026-05-21 at 10.29.44.jpeg" public/storys/lilas-floral.jpg
ls -la public/storys/lilas-floral.jpg
```

Expected: arquivo `public/storys/lilas-floral.jpg` (~113 KB) existe.

- [ ] **Step 2: Commit**

```bash
git add public/storys/lilas-floral.jpg
git commit -m "feat: adiciona fundo lilas floral do Canva"
```

---

### Task 3: Reduzir para 3 templates roxo/lilás

**Files:**
- Modify: `resources/js/lib/stories/templates.ts` (substituir os 5 temas por 3)

- [ ] **Step 1: Atualizar o teste de browser que referencia um template removido**

O teste em `tests/Browser/StoryGeneratorTest.php:22` clica em `'Dark Elegante'` (será removido). Trocar por um template mantido.

Edit `tests/Browser/StoryGeneratorTest.php`, substituir:

```php
    $page->click('Dark Elegante')
        ->assertNoSmoke();
```

por:

```php
    $page->click('Roxo Profundo')
        ->assertNoSmoke();
```

- [ ] **Step 2: Substituir o array de templates por 3 temas roxo/lilás**

Edit `resources/js/lib/stories/templates.ts`. Manter o bloco de tipos (`DecorationKey`, `TemplatePalette`, `TemplateTheme`). Os 3 novos temas usam `FONT_SERIF`, `FONT_SERIF_ALT` e `FONT_SANS` — então **remover** a linha da constante `FONT_SANS_ALT` (fica órfã e pode falhar lint/typecheck):

```ts
const FONT_SANS_ALT = "'Montserrat', ui-sans-serif, system-ui, sans-serif";
```

Substituir todo o array `TEMPLATES` e a constante `DEFAULT_TEMPLATE_ID` por:

```ts
export const TEMPLATES: TemplateTheme[] = [
    {
        id: 'lilas-floral',
        name: 'Lilás Floral',
        background: "url('/storys/lilas-floral.jpg') center / cover no-repeat",
        decoration: 'none',
        decorationColor: 'transparent',
        fonts: { display: FONT_SERIF, body: FONT_SANS },
        palette: {
            title: '#5d3f96',
            subtitle: '#6f55ac',
            cardBg: 'rgba(255, 255, 255, 0.85)',
            cardBorder: 'rgba(255, 255, 255, 0.7)',
            badgeBg: '#8a6fc4',
            badgeText: '#ffffff',
            timeText: '#5d3f96',
        },
    },
    {
        id: 'lavanda-liso',
        name: 'Lavanda Liso',
        background: 'linear-gradient(165deg, #d9ccf2 0%, #c3b0e8 55%, #cdbcee 100%)',
        decoration: 'none',
        decorationColor: 'transparent',
        fonts: { display: FONT_SERIF_ALT, body: FONT_SANS },
        palette: {
            title: '#5d3f96',
            subtitle: '#6f55ac',
            cardBg: 'rgba(255, 255, 255, 0.9)',
            cardBorder: 'rgba(255, 255, 255, 0.8)',
            badgeBg: '#8a6fc4',
            badgeText: '#ffffff',
            timeText: '#5d3f96',
        },
    },
    {
        id: 'roxo-profundo',
        name: 'Roxo Profundo',
        background: 'linear-gradient(160deg, #3a2a63 0%, #5b3f96 100%)',
        decoration: 'none',
        decorationColor: 'transparent',
        fonts: { display: FONT_SERIF, body: FONT_SANS },
        palette: {
            title: '#f1e9ff',
            subtitle: '#d9c9f5',
            cardBg: 'rgba(255, 255, 255, 0.92)',
            cardBorder: 'rgba(255, 255, 255, 0.6)',
            badgeBg: '#6f4fb0',
            badgeText: '#ffffff',
            timeText: '#3a2a63',
        },
    },
];

export const DEFAULT_TEMPLATE_ID = 'lilas-floral';
```

- [ ] **Step 3: Verificar typecheck/lint do build**

Run: `npm run build`
Expected: build sem erros de TypeScript. Se acusar import/constante não usada, confirmar que `FONT_SANS_ALT` foi removida no Step 2.

- [ ] **Step 4: Commit**

```bash
git add resources/js/lib/stories/templates.ts tests/Browser/StoryGeneratorTest.php
git commit -m "feat: reduz templates para 3 variacoes roxo/lilas do salao"
```

---

### Task 4: Ajustar o padding do conteúdo para não encostar nas flores

**Files:**
- Modify: `resources/js/components/stories/story-canvas.tsx:45`

- [ ] **Step 1: Aumentar o padding vertical do container de conteúdo**

Edit `resources/js/components/stories/story-canvas.tsx`, no `<div>` do conteúdo (o que tem `zIndex: 1`), trocar:

```tsx
                    padding: '120px 80px',
```

por:

```tsx
                    padding: '160px 80px',
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: build sem erros.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/stories/story-canvas.tsx
git commit -m "style: afasta conteudo do story das flores dos cantos"
```

---

### Task 5: Verificação final

**Files:** nenhum (somente verificação)

- [ ] **Step 1: Pint nos arquivos PHP alterados**

Run: `vendor/bin/pint --dirty --format agent`
Expected: sem erros; formata `tests/Browser/StoryGeneratorTest.php` se necessário.

- [ ] **Step 2: Teste de feature da página**

Run: `php artisan test --compact --filter=StoriesPage`
Expected: PASS (rota `/horarios` retorna 200 e renderiza `stories/index`).

- [ ] **Step 3: Teste de browser (se houver browser disponível)**

Run: `php artisan test --compact --filter=StoryGenerator`
Expected: PASS. Se o ambiente não tiver browser (Playwright) instalado, o teste é pulado/erra por falta de browser — registrar isso e validar manualmente no Step 4 em vez de tratar como falha de código.

- [ ] **Step 4: Verificação visual manual da fidelidade (gate principal)**

Pedir ao usuário (ou rodar `composer run dev` / `npm run dev`) e abrir `/horarios`:
- Os 3 templates aparecem (Lilás Floral, Lavanda Liso, Roxo Profundo) e nenhum dos antigos (Minimal/Dark/Nude/Gradiente).
- O template Lilás Floral mostra o fundo do Canva (flores brancas no canto sup-esq e inf-dir).
- Clicar em **Baixar PNG**: o PNG baixado tem o **mesmo alinhamento de título/horários e a mesma fonte** do preview (sem fallback), e o mesmo fundo.

- [ ] **Step 5: Commit final (se Pint alterou algo)**

```bash
git add -A
git commit -m "chore: pint + verificacao layout stories" || echo "nada a commitar"
```

---

## Notas de execução

- **Sem dependências npm novas.** As fontes são `.woff2` em `public/fonts/` referenciadas por `@font-face` no `app.css`.
- **Internet necessária na Task 1** para baixar os woff2 do Google. Se o sandbox não tiver rede, rodar o Step 1 da Task 1 fora do sandbox.
- **Política de commit:** o usuário pediu para não commitar antes de aprovação explícita. Confirmar antes de executar os `git commit` deste plano (ou agrupar tudo num commit final após a aprovação).
