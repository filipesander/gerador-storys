# Gerador de Stories — Plano de Implementação (V1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Página interna (atrás de login) onde a usuária preenche horários vagos, escolhe um template e baixa um PNG 1080×1920 pronto para o story do Instagram, com preview em tempo real.

**Architecture:** Gerador 100% client-side e stateless. Um único componente `StoryCanvas` (1080×1920, estilos data-driven via config de template) serve tanto o preview escalado quanto a exportação. O download captura uma instância em tamanho real (renderizada num container oculto) com `html-to-image`. Backend = uma rota `Route::inertia` protegida, sem controller nem persistência.

**Tech Stack:** Laravel 13 · Inertia v3 · React 19 · TypeScript · Tailwind v4 · shadcn/Radix · `html-to-image` · Pest 4 (feature + browser).

---

## Convenções verificadas no código (siga-as)

- **Página Inertia:** componente em `resources/js/pages/<nome>.tsx`, com `Component.layout = { breadcrumbs: [...] }` (vide `resources/js/pages/dashboard.tsx`). O `AppLayout` lê `breadcrumbs` automaticamente.
- **Rotas TS (Wayfinder):** uma rota nomeada `stories` gera `export const stories` em `@/routes`. Rode `php artisan wayfinder:generate` após criar a rota.
- **shadcn:** importe de `@/components/ui/*` (`button`, `input`, `label`, `card`, `select`, `toggle-group`). Util `cn` em `@/lib/utils`.
- **Cores data-driven:** como as cores/gradientes vêm da config em runtime, use **inline `style`** para cor/fundo/fonte e classes Tailwind só para layout.
- **Testes:** Pest. Feature tests seguem o padrão de `tests/Feature/DashboardTest.php` (`User::factory()->create()`, `actingAs`, `assertRedirect`/`assertOk`). Pint após mexer em PHP: `vendor/bin/pint --dirty --format agent`.

## Nota sobre testes de frontend (decisão do spec)

O V1 **não adiciona runner JS** (vitest). Logo:
- A lógica pura (`story-data.ts`, `templates.ts`) é verificada por `npm run types:check` e exercida pelo **teste de browser** (Pest 4) que valida o fluxo de ponta a ponta.
- O **gate sempre-verde** (roda em qualquer ambiente) é: teste *feature* da rota + `types:check` + `lint` + `build`.
- O **teste de browser** (Task 11) exige Playwright e um banco de testes; rode-o onde houver navegador disponível. É parte do entregável.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `routes/web.php` (modificar) | Registrar rota `stories` → `/horarios`, componente `stories/index`, atrás de `auth,verified`. |
| `resources/js/pages/stories/index.tsx` (criar) | Compor formulário + preview + download; dona do estado. |
| `resources/js/lib/stories/story-data.ts` (criar) | Tipos `StoryData`, dias da semana, defaults, `normalizeTime`. |
| `resources/js/lib/stories/templates.ts` (criar) | Tipo `TemplateTheme` + registry com 5 estilos + `getTemplate`. |
| `resources/js/lib/stories/export-png.ts` (criar) | Wrapper `html-to-image` + nome do arquivo + trigger de download. |
| `resources/js/components/stories/story-canvas.tsx` (criar) | Renderer 1080×1920 (preview + export). |
| `resources/js/components/stories/day-card.tsx` (criar) | Cartão de um dia (badge + horários). |
| `resources/js/components/stories/template-picker.tsx` (criar) | Grade de miniaturas selecionáveis. |
| `resources/js/components/stories/story-form.tsx` (criar) | Controles (modo, título, editor de dias/horários) + picker. |
| `resources/js/components/stories/decorations/{index,floral,leaves}.tsx` (criar) | Camadas SVG decorativas. |
| `resources/js/components/app-sidebar.tsx` (modificar) | Item de nav "Gerador de Stories". |
| `resources/css/app.css` (modificar) | Importar fontes (Playfair/Cormorant/Poppins/Montserrat). |
| `tests/Feature/StoriesPageTest.php` (criar) | Auth + render do componente Inertia. |
| `tests/Browser/StoryGeneratorTest.php` (criar) | Fluxo: preencher, trocar template, smoke. |
| `tests/Pest.php`, `.gitignore` (modificar) | Bind de `Browser`, ignorar screenshots. |

---

## Task 1: Rota, dependência, página-esqueleto e teste feature (TDD)

**Files:**
- Modify: `routes/web.php`
- Modify: `resources/js/components/app-sidebar.tsx`
- Create: `resources/js/pages/stories/index.tsx`
- Test: `tests/Feature/StoriesPageTest.php`

- [ ] **Step 1: Instalar a dependência aprovada**

Run: `npm install html-to-image`
Expected: adiciona `html-to-image` em `dependencies` do `package.json`.

- [ ] **Step 2: Escrever o teste feature (falhando)**

Create `tests/Feature/StoriesPageTest.php`:

```php
<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('visitantes sao redirecionados para o login', function () {
    $this->get(route('stories'))->assertRedirect(route('login'));
});

test('usuarios autenticados acessam o gerador de stories', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('stories'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('stories/index'));
});
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

Run: `php artisan test --compact --filter=StoriesPageTest`
Expected: FAIL — `Route [stories] not defined`.

- [ ] **Step 4: Registrar a rota**

In `routes/web.php`, dentro do grupo `['auth','verified']` (junto do `dashboard`):

```php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('horarios', 'stories/index')->name('stories');
});
```

- [ ] **Step 5: Gerar os helpers do Wayfinder**

Run: `php artisan wayfinder:generate`
Expected: `resources/js/routes/index.ts` passa a exportar `stories` (path `/horarios`).

- [ ] **Step 6: Criar a página-esqueleto**

Create `resources/js/pages/stories/index.tsx`:

```tsx
import { Head } from '@inertiajs/react';
import { stories } from '@/routes';

export default function StoriesIndex() {
    return (
        <>
            <Head title="Gerador de Stories" />
            <div className="p-4">
                <h1 className="text-2xl font-semibold">Gerador de Stories</h1>
            </div>
        </>
    );
}

StoriesIndex.layout = {
    breadcrumbs: [{ title: 'Gerador de Stories', href: stories() }],
};
```

- [ ] **Step 7: Adicionar o item na sidebar**

In `resources/js/components/app-sidebar.tsx`, importe o ícone e a rota, e acrescente ao `mainNavItems`:

```tsx
import { BookOpen, CalendarClock, FolderGit2, LayoutGrid } from 'lucide-react';
import { dashboard } from '@/routes';
import { stories } from '@/routes';
```

```tsx
const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Gerador de Stories',
        href: stories(),
        icon: CalendarClock,
    },
];
```

- [ ] **Step 8: Rodar o teste e confirmar que passa**

Run: `php artisan test --compact --filter=StoriesPageTest`
Expected: PASS (2 passed).

- [ ] **Step 9: Commit**

```bash
vendor/bin/pint --dirty --format agent
git add routes/web.php resources/js/pages/stories/index.tsx resources/js/components/app-sidebar.tsx resources/js/routes/index.ts tests/Feature/StoriesPageTest.php package.json package-lock.json
git commit -m "$(cat <<'EOF'
feat: rota e pagina-esqueleto do gerador de stories

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Fontes dos templates

**Files:**
- Modify: `resources/css/app.css`

- [ ] **Step 1: Importar as fontes**

In `resources/css/app.css`, logo após a linha `@import 'tw-animate-css';`, adicione:

```css
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@600;700;800&family=Poppins:wght@400;500;600;700&display=swap');
```

- [ ] **Step 2: Build para validar o CSS**

Run: `npm run build`
Expected: build conclui sem erro.

- [ ] **Step 3: Commit**

```bash
git add resources/css/app.css
git commit -m "$(cat <<'EOF'
feat: importar fontes display/sans dos templates

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Modelo de dados e helpers (`story-data.ts`)

**Files:**
- Create: `resources/js/lib/stories/story-data.ts`

- [ ] **Step 1: Criar o módulo**

Create `resources/js/lib/stories/story-data.ts`:

```ts
export type StoryMode = 'semana' | 'dia';

export const WEEKDAYS = [
    'segunda',
    'terca',
    'quarta',
    'quinta',
    'sexta',
    'sabado',
    'domingo',
] as const;

export type Weekday = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
    segunda: 'Segunda-feira',
    terca: 'Terça-feira',
    quarta: 'Quarta-feira',
    quinta: 'Quinta-feira',
    sexta: 'Sexta-feira',
    sabado: 'Sábado',
    domingo: 'Domingo',
};

export type DaySlot = {
    id: string;
    weekday: Weekday;
    times: string[];
};

export type StoryData = {
    mode: StoryMode;
    title: string;
    weekSlots: DaySlot[];
    date: string;
    dayTimes: string[];
};

export const DEFAULT_WEEK_TITLE = 'Horários da Semana';
export const DEFAULT_DAY_TITLE = 'Horários de Hoje';

export function defaultTitleForMode(mode: StoryMode): string {
    return mode === 'semana' ? DEFAULT_WEEK_TITLE : DEFAULT_DAY_TITLE;
}

export function createDaySlot(weekday: Weekday): DaySlot {
    return { id: crypto.randomUUID(), weekday, times: [] };
}

export function createDefaultStoryData(): StoryData {
    return {
        mode: 'semana',
        title: DEFAULT_WEEK_TITLE,
        weekSlots: [{ id: crypto.randomUUID(), weekday: 'terca', times: ['08:00'] }],
        date: new Date().toISOString().slice(0, 10),
        dayTimes: ['08:00'],
    };
}

/**
 * Normaliza entrada livre de horário para HH:MM 24h.
 * '8' -> '08:00' · '8:5' -> '08:05' · '0830' -> '08:30' · '25:99' -> '23:59'.
 */
export function normalizeTime(input: string): string {
    const trimmed = input.trim();
    if (trimmed === '') {
        return '';
    }

    let hours = 0;
    let minutes = 0;

    if (trimmed.includes(':')) {
        const [rawH, rawM = '0'] = trimmed.split(':');
        hours = parseInt(rawH.replace(/\D/g, '') || '0', 10);
        minutes = parseInt(rawM.replace(/\D/g, '') || '0', 10);
    } else {
        const digits = trimmed.replace(/\D/g, '');
        if (digits === '') {
            return '';
        }
        if (digits.length <= 2) {
            hours = parseInt(digits, 10);
        } else {
            hours = parseInt(digits.slice(0, digits.length - 2), 10);
            minutes = parseInt(digits.slice(-2), 10);
        }
    }

    hours = Math.min(23, Math.max(0, hours || 0));
    minutes = Math.min(59, Math.max(0, minutes || 0));

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
```

- [ ] **Step 2: Type-check**

Run: `npm run types:check`
Expected: PASS (sem erros).

- [ ] **Step 3: Commit**

```bash
git add resources/js/lib/stories/story-data.ts
git commit -m "$(cat <<'EOF'
feat: tipos e helpers de dados do story

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Registry de templates (`templates.ts`)

**Files:**
- Create: `resources/js/lib/stories/templates.ts`

- [ ] **Step 1: Criar o registry**

Create `resources/js/lib/stories/templates.ts`:

```ts
export type DecorationKey = 'floral' | 'folhas' | 'none';

export type TemplatePalette = {
    title: string;
    subtitle: string;
    cardBg: string;
    cardBorder: string;
    badgeBg: string;
    badgeText: string;
    timeText: string;
};

export type TemplateTheme = {
    id: string;
    name: string;
    background: string;
    decoration: DecorationKey;
    decorationColor: string;
    fonts: { display: string; body: string };
    palette: TemplatePalette;
};

const FONT_SERIF = "'Playfair Display', Georgia, serif";
const FONT_SERIF_ALT = "'Cormorant Garamond', Georgia, serif";
const FONT_SANS = "'Poppins', ui-sans-serif, system-ui, sans-serif";
const FONT_SANS_ALT = "'Montserrat', ui-sans-serif, system-ui, sans-serif";

export const TEMPLATES: TemplateTheme[] = [
    {
        id: 'lavanda-floral',
        name: 'Lavanda Floral',
        background: 'linear-gradient(165deg, #c3b0e8 0%, #a98fd9 55%, #b69ee3 100%)',
        decoration: 'floral',
        decorationColor: 'rgba(255, 255, 255, 0.55)',
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
        id: 'minimal-clean',
        name: 'Minimal Clean',
        background: '#f7f5f2',
        decoration: 'none',
        decorationColor: 'transparent',
        fonts: { display: FONT_SERIF_ALT, body: FONT_SANS },
        palette: {
            title: '#1f2933',
            subtitle: '#7b8794',
            cardBg: '#ffffff',
            cardBorder: '#e4e7eb',
            badgeBg: '#1f2933',
            badgeText: '#ffffff',
            timeText: '#1f2933',
        },
    },
    {
        id: 'dark-elegante',
        name: 'Dark Elegante',
        background: 'linear-gradient(160deg, #1a1622 0%, #241d33 100%)',
        decoration: 'folhas',
        decorationColor: 'rgba(212, 175, 108, 0.28)',
        fonts: { display: FONT_SERIF, body: FONT_SANS_ALT },
        palette: {
            title: '#e9d8a6',
            subtitle: '#c9b896',
            cardBg: 'rgba(255, 255, 255, 0.06)',
            cardBorder: 'rgba(233, 216, 166, 0.35)',
            badgeBg: '#d4af6c',
            badgeText: '#1a1622',
            timeText: '#f3ead0',
        },
    },
    {
        id: 'nude-bege',
        name: 'Nude / Bege',
        background: 'linear-gradient(165deg, #efe3d6 0%, #e3d0bd 100%)',
        decoration: 'folhas',
        decorationColor: 'rgba(150, 120, 90, 0.28)',
        fonts: { display: FONT_SERIF_ALT, body: FONT_SANS },
        palette: {
            title: '#7a5c43',
            subtitle: '#9b7b5e',
            cardBg: 'rgba(255, 255, 255, 0.72)',
            cardBorder: 'rgba(160, 130, 100, 0.45)',
            badgeBg: '#a67c52',
            badgeText: '#ffffff',
            timeText: '#7a5c43',
        },
    },
    {
        id: 'gradiente-vibrante',
        name: 'Gradiente Vibrante',
        background: 'linear-gradient(160deg, #ff7eb3 0%, #8a5cf6 100%)',
        decoration: 'none',
        decorationColor: 'transparent',
        fonts: { display: FONT_SERIF, body: FONT_SANS_ALT },
        palette: {
            title: '#ffffff',
            subtitle: 'rgba(255, 255, 255, 0.85)',
            cardBg: 'rgba(255, 255, 255, 0.18)',
            cardBorder: 'rgba(255, 255, 255, 0.45)',
            badgeBg: 'rgba(255, 255, 255, 0.95)',
            badgeText: '#8a5cf6',
            timeText: '#ffffff',
        },
    },
];

export const DEFAULT_TEMPLATE_ID = 'lavanda-floral';

export function getTemplate(id: string): TemplateTheme {
    return TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[0];
}
```

- [ ] **Step 2: Type-check**

Run: `npm run types:check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add resources/js/lib/stories/templates.ts
git commit -m "$(cat <<'EOF'
feat: registry de templates data-driven (5 estilos)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Decorações SVG

**Files:**
- Create: `resources/js/components/stories/decorations/floral.tsx`
- Create: `resources/js/components/stories/decorations/leaves.tsx`
- Create: `resources/js/components/stories/decorations/index.tsx`

> Decorações são propositalmente simples (flourishes nos cantos). Refine o visual depois do primeiro render.

- [ ] **Step 1: Criar `floral.tsx`**

```tsx
export function FloralDecoration({ color }: { color: string }) {
    return (
        <svg
            viewBox="0 0 1080 1920"
            width={1080}
            height={1920}
            style={{ position: 'absolute', inset: 0 }}
            aria-hidden
        >
            <g fill="none" stroke={color} strokeWidth={4} strokeLinecap="round">
                <path d="M80 120 C 180 60, 280 120, 300 240 C 200 200, 120 220, 80 120 Z" />
                <path d="M120 160 C 180 200, 200 280, 160 360" />
                <path d="M300 240 C 360 220, 420 250, 440 320" />
                <circle cx="300" cy="240" r="14" fill={color} stroke="none" />
                <path d="M1000 1800 C 900 1860, 800 1800, 780 1680 C 880 1720, 960 1700, 1000 1800 Z" />
                <path d="M960 1760 C 900 1720, 880 1640, 920 1560" />
                <path d="M780 1680 C 720 1700, 660 1670, 640 1600" />
                <circle cx="780" cy="1680" r="14" fill={color} stroke="none" />
            </g>
        </svg>
    );
}
```

- [ ] **Step 2: Criar `leaves.tsx`**

```tsx
export function LeavesDecoration({ color }: { color: string }) {
    return (
        <svg
            viewBox="0 0 1080 1920"
            width={1080}
            height={1920}
            style={{ position: 'absolute', inset: 0 }}
            aria-hidden
        >
            <g fill={color} stroke="none">
                <path d="M90 90 C 160 110, 200 180, 180 260 C 120 230, 80 170 90 90 Z" />
                <path d="M180 180 C 250 190, 300 250, 300 330 C 230 310, 190 250 180 180 Z" />
                <path d="M990 1830 C 920 1810, 880 1740, 900 1660 C 960 1690, 1000 1750 990 1830 Z" />
                <path d="M900 1740 C 830 1730, 780 1670, 780 1590 C 850 1610, 890 1670 900 1740 Z" />
            </g>
        </svg>
    );
}
```

- [ ] **Step 3: Criar o dispatcher `index.tsx`**

```tsx
import type { DecorationKey } from '@/lib/stories/templates';
import { FloralDecoration } from './floral';
import { LeavesDecoration } from './leaves';

export function Decoration({ decoration, color }: { decoration: DecorationKey; color: string }) {
    if (decoration === 'floral') {
        return <FloralDecoration color={color} />;
    }

    if (decoration === 'folhas') {
        return <LeavesDecoration color={color} />;
    }

    return null;
}
```

- [ ] **Step 4: Type-check**

Run: `npm run types:check`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add resources/js/components/stories/decorations
git commit -m "$(cat <<'EOF'
feat: camadas SVG de decoracao (floral/folhas)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: `DayCard` e `StoryCanvas`

**Files:**
- Create: `resources/js/components/stories/day-card.tsx`
- Create: `resources/js/components/stories/story-canvas.tsx`

- [ ] **Step 1: Criar `day-card.tsx`**

```tsx
import type { TemplateTheme } from '@/lib/stories/templates';

export function DayCard({
    template,
    label,
    times,
}: {
    template: TemplateTheme;
    label: string;
    times: string[];
}) {
    const { palette, fonts } = template;

    return (
        <div
            style={{
                background: palette.cardBg,
                border: `2px solid ${palette.cardBorder}`,
                borderRadius: 48,
                padding: '36px 56px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
                minWidth: 360,
            }}
        >
            <span
                style={{
                    background: palette.badgeBg,
                    color: palette.badgeText,
                    fontFamily: fonts.body,
                    fontWeight: 600,
                    fontSize: 30,
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    borderRadius: 999,
                    padding: '10px 32px',
                }}
            >
                {label}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                {times.map((time) => (
                    <span
                        key={time}
                        style={{ color: palette.timeText, fontFamily: fonts.body, fontSize: 52, fontWeight: 500 }}
                    >
                        {time}
                    </span>
                ))}
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Criar `story-canvas.tsx`**

```tsx
import { Decoration } from '@/components/stories/decorations';
import { DayCard } from '@/components/stories/day-card';
import { WEEKDAY_LABELS, type StoryData } from '@/lib/stories/story-data';
import type { TemplateTheme } from '@/lib/stories/templates';

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

function formatDate(iso: string): string {
    if (!iso) {
        return '';
    }
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
}

export function StoryCanvas({ template, data }: { template: TemplateTheme; data: StoryData }) {
    const { palette, fonts } = template;
    const weekCards = data.weekSlots.filter((slot) => slot.times.length > 0);

    return (
        <div
            style={{
                width: STORY_WIDTH,
                height: STORY_HEIGHT,
                background: template.background,
                fontFamily: fonts.body,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <Decoration decoration={template.decoration} color={template.decorationColor} />

            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    padding: '120px 80px',
                }}
            >
                <h1
                    style={{
                        fontFamily: fonts.display,
                        color: palette.title,
                        fontSize: 96,
                        lineHeight: 1.05,
                        fontWeight: 700,
                        textAlign: 'center',
                        margin: 0,
                    }}
                >
                    {data.title}
                </h1>

                {data.mode === 'dia' && (
                    <p
                        style={{
                            color: palette.subtitle,
                            fontSize: 40,
                            marginTop: 16,
                            letterSpacing: 4,
                            textTransform: 'uppercase',
                        }}
                    >
                        {formatDate(data.date)}
                    </p>
                )}

                <div
                    style={{
                        marginTop: 80,
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: 40,
                        width: '100%',
                    }}
                >
                    {data.mode === 'semana' ? (
                        weekCards.map((slot) => (
                            <DayCard
                                key={slot.id}
                                template={template}
                                label={WEEKDAY_LABELS[slot.weekday]}
                                times={slot.times}
                            />
                        ))
                    ) : (
                        <DayCard template={template} label="Disponíveis" times={data.dayTimes} />
                    )}
                </div>
            </div>
        </div>
    );
}
```

- [ ] **Step 3: Type-check + build**

Run: `npm run types:check && npm run build`
Expected: PASS / build conclui.

- [ ] **Step 4: Commit**

```bash
git add resources/js/components/stories/day-card.tsx resources/js/components/stories/story-canvas.tsx
git commit -m "$(cat <<'EOF'
feat: renderer StoryCanvas e DayCard (1080x1920)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: `TemplatePicker`

**Files:**
- Create: `resources/js/components/stories/template-picker.tsx`

- [ ] **Step 1: Criar o picker**

```tsx
import { StoryCanvas, STORY_HEIGHT, STORY_WIDTH } from '@/components/stories/story-canvas';
import type { StoryData } from '@/lib/stories/story-data';
import type { TemplateTheme } from '@/lib/stories/templates';
import { cn } from '@/lib/utils';

const THUMB_WIDTH = 96;

export function TemplatePicker({
    templates,
    value,
    onChange,
    data,
}: {
    templates: TemplateTheme[];
    value: string;
    onChange: (id: string) => void;
    data: StoryData;
}) {
    const scale = THUMB_WIDTH / STORY_WIDTH;

    return (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {templates.map((template) => (
                <button
                    type="button"
                    key={template.id}
                    onClick={() => onChange(template.id)}
                    aria-pressed={value === template.id}
                    className={cn(
                        'overflow-hidden rounded-xl border-2 transition',
                        value === template.id ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30',
                    )}
                >
                    <div style={{ width: THUMB_WIDTH, height: STORY_HEIGHT * scale }} className="overflow-hidden">
                        <div
                            style={{
                                width: STORY_WIDTH,
                                height: STORY_HEIGHT,
                                transform: `scale(${scale})`,
                                transformOrigin: 'top left',
                            }}
                        >
                            <StoryCanvas template={template} data={data} />
                        </div>
                    </div>
                    <span className="block py-1 text-center text-xs">{template.name}</span>
                </button>
            ))}
        </div>
    );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run types:check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/stories/template-picker.tsx
git commit -m "$(cat <<'EOF'
feat: grade de miniaturas de template

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: `StoryForm`

**Files:**
- Create: `resources/js/components/stories/story-form.tsx`

- [ ] **Step 1: Criar o formulário (com `TimesEditor` local)**

```tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { TemplatePicker } from '@/components/stories/template-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    createDaySlot,
    defaultTitleForMode,
    normalizeTime,
    WEEKDAYS,
    WEEKDAY_LABELS,
    type DaySlot,
    type StoryData,
    type StoryMode,
    type Weekday,
} from '@/lib/stories/story-data';
import { TEMPLATES } from '@/lib/stories/templates';

function TimesEditor({ times, onChange }: { times: string[]; onChange: (times: string[]) => void }) {
    const [draft, setDraft] = useState('');

    const add = () => {
        const time = normalizeTime(draft);
        if (time !== '' && !times.includes(time)) {
            onChange([...times, time].sort());
        }
        setDraft('');
    };

    return (
        <div>
            <div className="flex gap-2">
                <Input
                    value={draft}
                    placeholder="08:00"
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            add();
                        }
                    }}
                />
                <Button type="button" variant="secondary" onClick={add}>
                    Adicionar
                </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
                {times.map((time) => (
                    <button
                        type="button"
                        key={time}
                        onClick={() => onChange(times.filter((value) => value !== time))}
                        className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground hover:bg-muted-foreground/20"
                    >
                        {time} ✕
                    </button>
                ))}
            </div>
        </div>
    );
}

export function StoryForm({
    data,
    onChange,
    templateId,
    onTemplateChange,
}: {
    data: StoryData;
    onChange: (patch: Partial<StoryData>) => void;
    templateId: string;
    onTemplateChange: (id: string) => void;
}) {
    const setMode = (mode: StoryMode) => {
        onChange({ mode, title: defaultTitleForMode(mode) });
    };

    const updateSlot = (id: string, patch: Partial<DaySlot>) => {
        onChange({
            weekSlots: data.weekSlots.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)),
        });
    };

    const addSlot = () => {
        const used = new Set(data.weekSlots.map((slot) => slot.weekday));
        const next = WEEKDAYS.find((weekday) => !used.has(weekday)) ?? 'segunda';
        onChange({ weekSlots: [...data.weekSlots, createDaySlot(next)] });
    };

    const removeSlot = (id: string) => {
        onChange({ weekSlots: data.weekSlots.filter((slot) => slot.id !== id) });
    };

    return (
        <div className="space-y-6">
            <ToggleGroup
                type="single"
                value={data.mode}
                onValueChange={(value) => value && setMode(value as StoryMode)}
                variant="outline"
            >
                <ToggleGroupItem value="semana">Semana</ToggleGroupItem>
                <ToggleGroupItem value="dia">Dia</ToggleGroupItem>
            </ToggleGroup>

            <div className="space-y-2">
                <Label htmlFor="story-title">Título</Label>
                <Input
                    id="story-title"
                    value={data.title}
                    onChange={(event) => onChange({ title: event.target.value })}
                />
            </div>

            {data.mode === 'semana' ? (
                <div className="space-y-3">
                    {data.weekSlots.map((slot) => (
                        <Card key={slot.id}>
                            <CardContent className="space-y-3 p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <Select
                                        value={slot.weekday}
                                        onValueChange={(weekday) => updateSlot(slot.id, { weekday: weekday as Weekday })}
                                    >
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {WEEKDAYS.map((weekday) => (
                                                <SelectItem key={weekday} value={weekday}>
                                                    {WEEKDAY_LABELS[weekday]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSlot(slot.id)}>
                                        <X className="size-4" />
                                    </Button>
                                </div>
                                <TimesEditor times={slot.times} onChange={(times) => updateSlot(slot.id, { times })} />
                            </CardContent>
                        </Card>
                    ))}
                    <Button type="button" variant="outline" onClick={addSlot}>
                        + Adicionar dia
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="story-date">Data</Label>
                        <Input
                            id="story-date"
                            type="date"
                            value={data.date}
                            onChange={(event) => onChange({ date: event.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Horários</Label>
                        <TimesEditor times={data.dayTimes} onChange={(dayTimes) => onChange({ dayTimes })} />
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <Label>Template</Label>
                <TemplatePicker templates={TEMPLATES} value={templateId} onChange={onTemplateChange} data={data} />
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Type-check**

Run: `npm run types:check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add resources/js/components/stories/story-form.tsx
git commit -m "$(cat <<'EOF'
feat: formulario do gerador (modo, titulo, dias/horarios, picker)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Exportação PNG (`export-png.ts`)

**Files:**
- Create: `resources/js/lib/stories/export-png.ts`

- [ ] **Step 1: Criar o wrapper**

```ts
import { toPng } from 'html-to-image';
import { STORY_HEIGHT, STORY_WIDTH } from '@/components/stories/story-canvas';

export function buildStoryFilename(date: Date = new Date()): string {
    return `horarios-${date.toISOString().slice(0, 10)}.png`;
}

export async function exportStoryToPng(node: HTMLElement, filename: string): Promise<void> {
    if (document.fonts?.ready) {
        await document.fonts.ready;
    }

    const dataUrl = await toPng(node, {
        width: STORY_WIDTH,
        height: STORY_HEIGHT,
        pixelRatio: 1,
        cacheBust: true,
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
}
```

- [ ] **Step 2: Type-check**

Run: `npm run types:check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add resources/js/lib/stories/export-png.ts
git commit -m "$(cat <<'EOF'
feat: exportacao PNG via html-to-image

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Montagem da página (preview + download)

**Files:**
- Modify: `resources/js/pages/stories/index.tsx`

- [ ] **Step 1: Substituir a página-esqueleto pela composição completa**

Replace o conteúdo de `resources/js/pages/stories/index.tsx` por:

```tsx
import { Head } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useRef, useState } from 'react';
import { StoryCanvas, STORY_HEIGHT, STORY_WIDTH } from '@/components/stories/story-canvas';
import { StoryForm } from '@/components/stories/story-form';
import { Button } from '@/components/ui/button';
import { buildStoryFilename, exportStoryToPng } from '@/lib/stories/export-png';
import { createDefaultStoryData, type StoryData } from '@/lib/stories/story-data';
import { DEFAULT_TEMPLATE_ID, getTemplate } from '@/lib/stories/templates';
import { stories } from '@/routes';

const PREVIEW_WIDTH = 320;

export default function StoriesIndex() {
    const [data, setData] = useState<StoryData>(() => createDefaultStoryData());
    const [templateId, setTemplateId] = useState<string>(DEFAULT_TEMPLATE_ID);
    const [exporting, setExporting] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    const template = getTemplate(templateId);
    const previewScale = PREVIEW_WIDTH / STORY_WIDTH;

    const handleChange = (patch: Partial<StoryData>) => {
        setData((previous) => ({ ...previous, ...patch }));
    };

    const handleDownload = async () => {
        if (!exportRef.current) {
            return;
        }
        setExporting(true);
        try {
            await exportStoryToPng(exportRef.current, buildStoryFilename());
        } finally {
            setExporting(false);
        }
    };

    return (
        <>
            <Head title="Gerador de Stories" />

            <div className="flex flex-col gap-8 p-4 lg:flex-row">
                <div className="flex-1">
                    <StoryForm
                        data={data}
                        onChange={handleChange}
                        templateId={templateId}
                        onTemplateChange={setTemplateId}
                    />
                </div>

                <div className="flex flex-col items-center gap-4">
                    <div
                        style={{ width: PREVIEW_WIDTH, height: STORY_HEIGHT * previewScale }}
                        className="overflow-hidden rounded-[2rem] border-4 border-foreground/10 shadow-xl"
                    >
                        <div
                            style={{
                                width: STORY_WIDTH,
                                height: STORY_HEIGHT,
                                transform: `scale(${previewScale})`,
                                transformOrigin: 'top left',
                            }}
                        >
                            <StoryCanvas template={template} data={data} />
                        </div>
                    </div>

                    <Button onClick={handleDownload} disabled={exporting}>
                        <Download className="mr-2 size-4" />
                        {exporting ? 'Gerando…' : 'Baixar PNG'}
                    </Button>
                </div>
            </div>

            <div aria-hidden style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none' }}>
                <div ref={exportRef}>
                    <StoryCanvas template={template} data={data} />
                </div>
            </div>
        </>
    );
}

StoriesIndex.layout = {
    breadcrumbs: [{ title: 'Gerador de Stories', href: stories() }],
};
```

- [ ] **Step 2: Type-check + build**

Run: `npm run types:check && npm run build`
Expected: PASS / build conclui.

- [ ] **Step 3: Verificação visual manual**

Run: `composer run dev` (ou `npm run dev`), faça login, acesse `/horarios`. Confirme: preview atualiza ao digitar; trocar template muda o visual; "Baixar PNG" baixa `horarios-<data>.png` com a **fonte correta** (não fallback). Se a fonte sair errada, ver "Riscos" no spec (garantir `document.fonts.ready`).

- [ ] **Step 4: Commit**

```bash
git add resources/js/pages/stories/index.tsx
git commit -m "$(cat <<'EOF'
feat: montar pagina do gerador com preview e download

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Teste de browser (Pest 4) e gates finais

**Files:**
- Modify: `tests/Pest.php`
- Modify: `.gitignore`
- Create: `tests/Browser/StoryGeneratorTest.php`

> Requer navegador (Playwright) e banco de testes. Rode onde houver navegador. Se o ambiente não tiver navegador, os gates sempre-verdes (feature + types + lint + build) ainda cobrem rota e compilação; rode o browser test localmente.

- [ ] **Step 1: Instalar o plugin de browser do Pest**

```bash
composer require pestphp/pest-plugin-browser --dev
npm install playwright@latest
npx playwright install
```

- [ ] **Step 2: Vincular a suíte `Browser` no Pest e ignorar screenshots**

In `tests/Pest.php`, troque a linha do bind:

```php
pest()->extend(TestCase::class)
    ->in('Feature', 'Browser');
```

In `.gitignore`, acrescente:

```
/tests/Browser/Screenshots
```

- [ ] **Step 3: Escrever o teste de browser**

Create `tests/Browser/StoryGeneratorTest.php`:

```php
<?php

use App\Models\User;

test('gera o preview de horarios e nao quebra', function () {
    $this->actingAs(User::factory()->create());

    $page = visit('/horarios');

    $page->assertSee('Horários da Semana')
        ->assertSee('08:00')
        ->click('Dia')
        ->assertSee('Horários de Hoje')
        ->assertNoSmoke();
});

test('trocar de template nao gera erros', function () {
    $this->actingAs(User::factory()->create());

    $page = visit('/horarios');

    $page->click('Dark Elegante')
        ->assertNoSmoke();
});
```

- [ ] **Step 4: Rodar os testes de browser**

Run: `php artisan test --compact tests/Browser/StoryGeneratorTest.php`
Expected: PASS (2 passed).

- [ ] **Step 5: Gates finais (sempre-verde)**

```bash
vendor/bin/pint --dirty --format agent
npm run lint
npm run types:check
npm run build
php artisan test --compact
```
Expected: tudo verde.

- [ ] **Step 6: Commit**

```bash
git add tests/Pest.php tests/Browser/StoryGeneratorTest.php .gitignore composer.json composer.lock package.json package-lock.json
git commit -m "$(cat <<'EOF'
test: browser test do gerador de stories + gates

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-review (feito)

- **Cobertura do spec:** rota atrás de login (T1) ✓ · stateless (sem models) ✓ · modos semana/dia (T3/T6/T8) ✓ · templates data-driven CSS/SVG, 5 estilos (T4/T5) ✓ · preview tempo real (T10) ✓ · download PNG 1080×1920 (T9/T10) ✓ · sem marca do salão ✓ · `html-to-image` aprovado (T1) ✓ · testes feature + browser (T1/T11) ✓ · WhatsApp/persistência fora do escopo ✓.
- **Placeholders:** nenhum — todo passo de código traz o código completo.
- **Consistência de tipos:** `StoryData`/`DaySlot`/`Weekday`/`TemplateTheme` definidos em T3/T4 e usados igual em T6–T10; `STORY_WIDTH`/`STORY_HEIGHT` exportados em T6 e reusados em T7/T9/T10; `exportStoryToPng`/`buildStoryFilename` (T9) batem com o uso em T10; `normalizeTime`/`createDaySlot`/`defaultTitleForMode` (T3) batem com T8.
