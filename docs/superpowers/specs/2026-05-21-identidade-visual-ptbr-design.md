# Identidade Visual (Roxo/Lilás) + Landing + Tradução PT-BR — Design

**Data:** 2026-05-21
**Status:** Aprovado para planejamento
**Marca:** Stephanie
**Stack:** Laravel 13 · Inertia v3 · React 19 · Tailwind v4 · shadcn/Radix

## Contexto e objetivo

O app hoje usa o visual padrão do Laravel React Starter Kit: paleta neutra (cinza/preto),
textos em inglês, landing genérica e logo "Laravel Starter Kit". Vamos dar uma identidade
**roxo/lilás** voltada ao salão da **Stephanie**, criar uma **landing page** pública que
apresenta o sistema (gerador de stories de horários), redesenhar **login/registro**, e
**traduzir todo o sistema para português (pt-BR)**.

Decisões de design foram delegadas (o usuário pediu "faça o melhor design"). A única escolha
travada com o usuário: **marca = "Stephanie"**.

## Escopo

Incluído:
1. **Tema roxo/lilás global** via variáveis CSS do shadcn (light + dark).
2. **Logo/marca** "Stephanie" (wordmark Playfair Display + ícone floral SVG).
3. **Landing page** pública em `/` apresentando o sistema.
4. **Redesenho de login/registro** (e demais telas de auth) com layout split branded.
5. **Tradução completa pt-BR** do frontend + mensagens de validação/auth do backend.
6. **Limpeza** de resíduos do starter kit (links "Repository"/"Documentation", nome do app).

Fora do escopo:
- Mudar a lógica do gerador de stories (já entregue).
- i18n multi-idioma (single-language pt-BR; strings fixas no frontend — YAGNI).
- WhatsApp / persistência (fases futuras já registradas).

## 1. Identidade visual (tema)

Themo o app inteiro por `resources/css/app.css` (todo componente shadcn herda das vars).
Tons violeta/lilás em OKLCH, **light e dark**. Valores representativos (exatos no plano):

**Light (`:root`):**
- `--primary: oklch(0.55 0.20 293)` (~#7C3AED) · `--primary-foreground: oklch(0.985 0.01 293)`
- `--ring: oklch(0.55 0.20 293)`
- `--accent: oklch(0.95 0.03 300)` · `--accent-foreground: oklch(0.38 0.13 293)`
- `--secondary: oklch(0.96 0.015 300)` · `--muted: oklch(0.97 0.01 300)` · `--muted-foreground: oklch(0.55 0.03 295)`
- `--background: oklch(0.99 0.005 300)` · `--foreground: oklch(0.21 0.02 295)` · `--card: oklch(1 0 0)`
- `--border`/`--input: oklch(0.92 0.015 300)`
- `--sidebar*`: violeta na primária/ring, lilás no accent.
- `--chart-1..5`: família violeta/lilás/rosa.

**Dark (`.dark`):**
- `--primary: oklch(0.68 0.17 293)` · `--primary-foreground: oklch(0.18 0.03 295)`
- `--background: oklch(0.16 0.02 295)` · `--foreground: oklch(0.97 0.01 300)`
- `--accent: oklch(0.30 0.06 295)` · `--sidebar: oklch(0.20 0.025 295)` · demais coerentes.

**Tipografia:** reuso fontes já carregadas (sem dependência nova):
- **Playfair Display** → wordmark da marca e títulos de destaque da landing.
- **Instrument Sans** (atual `--font-sans`) → corpo/UI, mantido.
- Defino uma var/utilidade pra família display (ex.: classe `font-display`) usando Playfair.

## 2. Logo / marca

- `resources/js/components/app-logo-icon.tsx`: novo SVG — mark floral/sparkle simples
  (preenchível por `currentColor`, branco sobre o quadrado violeta `bg-sidebar-primary`).
- `resources/js/components/app-logo.tsx`: wordmark **"Stephanie"** em Playfair (substitui
  "Laravel Starter Kit").
- Nome do app: `VITE_APP_NAME="Stephanie"` (usado em `app.tsx`) e `APP_NAME="Stephanie"`.

## 3. Landing page (`/` — `resources/js/pages/welcome.tsx`)

Pública (sem layout do app), responsiva, light/dark, em PT:
- **Topbar:** marca à esquerda; à direita "Entrar"/"Criar conta" (ou "Painel" se `auth.user`).
- **Hero:** headline em Playfair (ex.: *"Stories de horários prontos em segundos"*) +
  subtítulo curto explicando o fluxo (digitar horários → escolher template lilás → baixar a
  imagem pronta pro Instagram) + CTA ("Entrar"/"Começar agora"). Ao lado, **mockup de celular
  renderizando um story real** reusando `StoryCanvas` (template `lavanda-floral`, dados de
  exemplo) escalado.
- **Como funciona:** 3 passos com ícone (Preencher horários → Escolher template → Baixar e postar).
- **Vitrine de templates:** faixa com as 5 miniaturas (reuso de `StoryCanvas` escalado).
- **Rodapé:** enxuto ("Feito para Stephanie" + ano).

> O mockup/vitrine reusa componentes do gerador (`@/components/stories/*`) e
> `@/lib/stories/templates`, com dados de exemplo definidos na própria landing.

## 4. Login / registro / auth

- Trocar o layout de auth para o **split** (`resources/js/layouts/auth/auth-split-layout.tsx`,
  via `auth-layout.tsx`): no desktop, painel esquerdo violeta (gradiente) com a marca +
  tagline + mini-story; à direita, o formulário. No mobile, só o formulário centralizado.
- Telas traduzidas e com identidade roxa (botões violeta vêm do tema):
  `login`, `register`, `forgot-password`, `reset-password`, `confirm-password`.
- Títulos/descrições (`Component.layout = { title, description }`) em PT.

## 5. Tradução completa pt-BR

**Frontend (strings fixas em PT, sem lib de i18n):**
- Auth (acima), `dashboard` (→ "Painel"), `settings/{profile,security,appearance}`.
- Componentes: `app-sidebar` (nav "Painel", "Gerador de Stories"), `nav-user`,
  `user-menu-content`, `breadcrumbs`, `delete-user`, `appearance-tabs`, e demais textos visíveis.
- Remover do rodapé da sidebar (`app-sidebar.tsx`) os itens "Repository"/"Documentation".

**Backend (mensagens do framework/Fortify em PT):**
- Criar `lang/pt_BR/auth.php`, `lang/pt_BR/validation.php`, `lang/pt_BR/passwords.php` e
  `lang/pt_BR.json` (traduções pt-BR padrão da comunidade).
- Setar locale: `APP_LOCALE=pt_BR` em `.env` e `.env.example` (lido por `config/app.php`).

## Inventário de arquivos

| Arquivo | Mudança |
|---|---|
| `resources/css/app.css` | vars de tema violeta/lilás (light+dark); var/utilidade `font-display`. |
| `resources/js/components/app-logo-icon.tsx` | novo ícone SVG floral/sparkle. |
| `resources/js/components/app-logo.tsx` | wordmark "Stephanie". |
| `resources/js/pages/welcome.tsx` | landing completa (PT, roxa, mockup + vitrine). |
| `resources/js/layouts/auth-layout.tsx` + `auth/auth-split-layout.tsx` | split branded. |
| `resources/js/pages/auth/*.tsx` | PT + identidade. |
| `resources/js/pages/dashboard.tsx` | PT ("Painel"), card de atalho ao gerador. |
| `resources/js/pages/settings/*.tsx` | PT. |
| `resources/js/components/{app-sidebar,nav-user,user-menu-content,breadcrumbs,delete-user,appearance-tabs}.tsx` | PT + limpeza. |
| `lang/pt_BR/{auth,validation,passwords}.php`, `lang/pt_BR.json` | traduções backend. |
| `.env`, `.env.example` | `APP_NAME="Stephanie"`, `APP_LOCALE=pt_BR`, `VITE_APP_NAME="Stephanie"`. |

## Mecânica & testes

- A virada de tema é majoritariamente CSS vars; o resto é texto + 2 layouts/landing.
- **Manter todos os gates verdes** (`pint`, `lint`, `types:check`, `build`, `php artisan test tests/Feature tests/Unit`).
- Revisar testes que afirmem texto/locale em inglês (auth, settings) e atualizar. A troca de
  `APP_LOCALE=pt_BR` pode mudar mensagens de validação esperadas — ajustar os asserts.
- Adicionar teste feature simples da landing (`/` retorna 200, componente Inertia `welcome`).
- Browser test do gerador segue válido (não roda neste WSL2 por falta de `libnspr4`).
- **Nada commitado** até revisão do usuário (modo "segurar commits").

## Riscos / atenção

- **Contraste/acessibilidade** dos tons violeta em dark mode — checar legibilidade.
- **Locale pt_BR**: garantir que Fortify/validação usem as novas lang files; conferir testes.
- **Reuso do StoryCanvas na landing**: é 1080×1920 escalado — usar wrappers de escala como na
  página do gerador, sem quebrar layout responsivo.
- Não introduzir dependências novas.
