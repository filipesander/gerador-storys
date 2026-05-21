# Identidade Visual Roxo/Lilás + Landing + Tradução PT-BR — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar ao app uma identidade visual roxo/lilás da marca "Stephanie", criar uma landing page que apresenta o gerador de stories, e traduzir todo o sistema para português (pt-BR).

**Architecture:** Tema global via variáveis CSS do shadcn (todo componente herda). Landing e painel de auth são peças de design — reusam o `StoryCanvas` do gerador como mockup. Tradução: strings fixas em pt-BR no frontend + lang files pt-BR no backend com `APP_LOCALE=pt_BR`.

**Tech Stack:** Laravel 13 · Inertia v3 · React 19 · Tailwind v4 · shadcn/Radix · Playfair Display (já carregada).

---

## Profundidade deste plano (importante)

Por pedido do usuário ("faça o melhor design e front end"), as **superfícies criativas**
(landing page e painel branded do auth) vão como **brief de design + cópia exata em PT**, e o
implementador deve **ativar a skill `frontend-design`** para produzir o código final com
qualidade — não há código pixel-a-pixel congelado para essas duas telas. Todo o resto
(tema, logo, lang files, env, troca de layout, traduções) tem **conteúdo exato**.

## Regras de execução

- **NÃO commitar nada** (modo "segurar commits" do usuário). Pule todos os "Step: Commit".
- Não adicionar dependências.
- Após mexer em PHP: `vendor/bin/pint --dirty --format agent`.
- Gates por task conforme indicado; gate final completo na última task.

## Glossário PT-BR (use para consistência em TODA tradução)

| EN | PT-BR |
|---|---|
| Log in / Sign in | Entrar |
| Log out | Sair |
| Register / Sign up | Criar conta |
| Create account | Criar conta |
| Email / Email address | E-mail |
| Password | Senha |
| Confirm password | Confirmar senha |
| Remember me | Lembrar de mim |
| Forgot password? | Esqueceu a senha? |
| Name / Full name | Nome / Nome completo |
| Dashboard | Painel |
| Settings | Configurações |
| Profile | Perfil |
| Appearance | Aparência |
| Save | Salvar |
| Light / Dark / System | Claro / Escuro / Sistema |
| Don't have an account? | Não tem uma conta? |
| Already have an account? | Já tem uma conta? |
| Delete account | Excluir conta |
| Password (confirm screen) | Confirme sua senha |

---

## Task 1: Tema roxo/lilás (CSS vars)

**Files:**
- Modify: `resources/css/app.css`

- [ ] **Step 1: Substituir o bloco `:root` (cores) pelos tons violeta/lilás**

Em `resources/css/app.css`, substitua os valores das variáveis de cor dentro de `:root {` por:

```css
    --background: oklch(0.99 0.005 300);
    --foreground: oklch(0.21 0.02 295);
    --card: oklch(1 0 0);
    --card-foreground: oklch(0.21 0.02 295);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.21 0.02 295);
    --primary: oklch(0.55 0.20 293);
    --primary-foreground: oklch(0.985 0.01 293);
    --secondary: oklch(0.96 0.015 300);
    --secondary-foreground: oklch(0.38 0.13 293);
    --muted: oklch(0.97 0.01 300);
    --muted-foreground: oklch(0.55 0.03 295);
    --accent: oklch(0.95 0.03 300);
    --accent-foreground: oklch(0.38 0.13 293);
    --destructive: oklch(0.577 0.245 27.325);
    --destructive-foreground: oklch(0.577 0.245 27.325);
    --border: oklch(0.92 0.015 300);
    --input: oklch(0.92 0.015 300);
    --ring: oklch(0.55 0.20 293);
    --chart-1: oklch(0.55 0.20 293);
    --chart-2: oklch(0.65 0.16 310);
    --chart-3: oklch(0.72 0.13 330);
    --chart-4: oklch(0.78 0.11 280);
    --chart-5: oklch(0.62 0.18 300);
    --radius: 0.75rem;
    --sidebar: oklch(0.985 0.008 300);
    --sidebar-foreground: oklch(0.21 0.02 295);
    --sidebar-primary: oklch(0.55 0.20 293);
    --sidebar-primary-foreground: oklch(0.985 0.01 293);
    --sidebar-accent: oklch(0.95 0.03 300);
    --sidebar-accent-foreground: oklch(0.38 0.13 293);
    --sidebar-border: oklch(0.92 0.015 300);
    --sidebar-ring: oklch(0.55 0.20 293);
```

(Mantenha as linhas `--radius-lg/md/sm` e `@theme` como estão.)

- [ ] **Step 2: Substituir o bloco `.dark` (cores) pelos tons violeta no escuro**

Substitua os valores de cor dentro de `.dark {` por:

```css
    --background: oklch(0.16 0.02 295);
    --foreground: oklch(0.97 0.01 300);
    --card: oklch(0.20 0.025 295);
    --card-foreground: oklch(0.97 0.01 300);
    --popover: oklch(0.20 0.025 295);
    --popover-foreground: oklch(0.97 0.01 300);
    --primary: oklch(0.68 0.17 293);
    --primary-foreground: oklch(0.18 0.03 295);
    --secondary: oklch(0.28 0.03 295);
    --secondary-foreground: oklch(0.97 0.01 300);
    --muted: oklch(0.28 0.03 295);
    --muted-foreground: oklch(0.72 0.03 300);
    --accent: oklch(0.32 0.05 295);
    --accent-foreground: oklch(0.97 0.01 300);
    --destructive: oklch(0.396 0.141 25.723);
    --destructive-foreground: oklch(0.637 0.237 25.331);
    --border: oklch(0.30 0.03 295);
    --input: oklch(0.30 0.03 295);
    --ring: oklch(0.68 0.17 293);
    --chart-1: oklch(0.68 0.17 293);
    --chart-2: oklch(0.72 0.15 310);
    --chart-3: oklch(0.76 0.13 330);
    --chart-4: oklch(0.70 0.14 280);
    --chart-5: oklch(0.66 0.17 300);
    --sidebar: oklch(0.20 0.025 295);
    --sidebar-foreground: oklch(0.97 0.01 300);
    --sidebar-primary: oklch(0.68 0.17 293);
    --sidebar-primary-foreground: oklch(0.18 0.03 295);
    --sidebar-accent: oklch(0.32 0.05 295);
    --sidebar-accent-foreground: oklch(0.97 0.01 300);
    --sidebar-border: oklch(0.30 0.03 295);
    --sidebar-ring: oklch(0.68 0.17 293);
```

- [ ] **Step 3: Adicionar utilidade de fonte display (Playfair)**

No final de `resources/css/app.css`, adicione:

```css
@utility font-display {
    font-family: 'Playfair Display', Georgia, serif;
}
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: build conclui sem erro.

---

## Task 2: Marca (logo + nome do app)

**Files:**
- Modify: `resources/js/components/app-logo-icon.tsx`
- Modify: `resources/js/components/app-logo.tsx`
- Modify: `.env`, `.env.example`

- [ ] **Step 1: Novo ícone floral (substituir todo o arquivo)**

`resources/js/components/app-logo-icon.tsx`:

```tsx
import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path
                fill="currentColor"
                d="M16 3c1.4 2.2 1.4 4.6 0 6.8C14.6 7.6 14.6 5.2 16 3Zm0 26c-1.4-2.2-1.4-4.6 0-6.8 1.4 2.2 1.4 4.6 0 6.8ZM3 16c2.2-1.4 4.6-1.4 6.8 0-2.2 1.4-4.6 1.4-6.8 0Zm19.2 0c2.2-1.4 4.6-1.4 6.8 0-2.2 1.4-4.6 1.4-6.8 0ZM6.7 6.7c2.6.2 4.6 1.6 5.6 3.8-2.6-.2-4.6-1.6-5.6-3.8Zm13 13c2.6.2 4.6 1.6 5.6 3.8-2.6-.2-4.6-1.6-5.6-3.8Zm5.6-13c-1 2.2-3 3.6-5.6 3.8 1-2.2 3-3.6 5.6-3.8Zm-13 13c-1 2.2-3 3.6-5.6 3.8 1-2.2 3-3.6 5.6-3.8Z"
            />
            <circle cx="16" cy="16" r="3.4" fill="currentColor" />
        </svg>
    );
}
```

- [ ] **Step 2: Wordmark "Stephanie" (substituir todo o arquivo)**

`resources/js/components/app-logo.tsx`:

```tsx
import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <AppLogoIcon className="size-5" />
            </div>
            <div className="ml-1 grid flex-1 text-left">
                <span className="font-display truncate text-base leading-tight font-semibold">
                    Stephanie
                </span>
                <span className="truncate text-xs text-muted-foreground">
                    Gerador de Stories
                </span>
            </div>
        </>
    );
}
```

- [ ] **Step 3: Nome do app e locale no `.env` e `.env.example`**

Em **ambos** os arquivos, altere:

```
APP_NAME=Stephanie
APP_LOCALE=pt_BR
```

(`VITE_APP_NAME="${APP_NAME}"` e `MAIL_FROM_NAME` já derivam de `APP_NAME` — não precisa mexer.)

- [ ] **Step 4: Limpar cache de config e rebuildar (VITE_APP_NAME é build-time)**

Run: `php artisan config:clear && npm run build`
Expected: sem erro; o nome "Stephanie" passa a aparecer no `<title>` e na marca.

- [ ] **Step 5: Type-check**

Run: `npm run types:check`
Expected: PASS.

---

## Task 3: Backend pt-BR (lang files + locale)

**Files:**
- Create: `lang/pt_BR/auth.php`
- Create: `lang/pt_BR/passwords.php`
- Create: `lang/pt_BR/validation.php`

> `APP_LOCALE=pt_BR` já foi setado na Task 2. `config/app.php` lê de `env('APP_LOCALE')`.
> Não criamos `lang/pt_BR.json`: as strings de frontend são fixas em PT (não usam `__()`).

- [ ] **Step 1: `lang/pt_BR/auth.php`**

```php
<?php

return [
    'failed' => 'Essas credenciais não correspondem aos nossos registros.',
    'password' => 'A senha informada está incorreta.',
    'throttle' => 'Muitas tentativas de login. Tente novamente em :seconds segundos.',
];
```

- [ ] **Step 2: `lang/pt_BR/passwords.php`**

```php
<?php

return [
    'reset' => 'Sua senha foi redefinida!',
    'sent' => 'Enviamos por e-mail o link de redefinição de senha!',
    'throttled' => 'Aguarde antes de tentar novamente.',
    'token' => 'Este token de redefinição de senha é inválido.',
    'user' => 'Não encontramos um usuário com esse endereço de e-mail.',
];
```

- [ ] **Step 3: `lang/pt_BR/validation.php`**

```php
<?php

return [
    'accepted' => 'O campo :attribute deve ser aceito.',
    'active_url' => 'O campo :attribute não é uma URL válida.',
    'after' => 'O campo :attribute deve ser uma data posterior a :date.',
    'alpha' => 'O campo :attribute deve conter apenas letras.',
    'alpha_dash' => 'O campo :attribute deve conter apenas letras, números, hífens e sublinhados.',
    'alpha_num' => 'O campo :attribute deve conter apenas letras e números.',
    'array' => 'O campo :attribute deve ser um array.',
    'before' => 'O campo :attribute deve ser uma data anterior a :date.',
    'between' => [
        'numeric' => 'O campo :attribute deve estar entre :min e :max.',
        'file' => 'O campo :attribute deve ter entre :min e :max kilobytes.',
        'string' => 'O campo :attribute deve ter entre :min e :max caracteres.',
        'array' => 'O campo :attribute deve ter entre :min e :max itens.',
    ],
    'boolean' => 'O campo :attribute deve ser verdadeiro ou falso.',
    'confirmed' => 'A confirmação do campo :attribute não corresponde.',
    'current_password' => 'A senha está incorreta.',
    'date' => 'O campo :attribute não é uma data válida.',
    'email' => 'O campo :attribute deve ser um endereço de e-mail válido.',
    'in' => 'O campo :attribute selecionado é inválido.',
    'integer' => 'O campo :attribute deve ser um número inteiro.',
    'max' => [
        'numeric' => 'O campo :attribute não pode ser maior que :max.',
        'file' => 'O campo :attribute não pode ter mais que :max kilobytes.',
        'string' => 'O campo :attribute não pode ter mais que :max caracteres.',
        'array' => 'O campo :attribute não pode ter mais que :max itens.',
    ],
    'min' => [
        'numeric' => 'O campo :attribute deve ser pelo menos :min.',
        'file' => 'O campo :attribute deve ter pelo menos :min kilobytes.',
        'string' => 'O campo :attribute deve ter pelo menos :min caracteres.',
        'array' => 'O campo :attribute deve ter pelo menos :min itens.',
    ],
    'required' => 'O campo :attribute é obrigatório.',
    'string' => 'O campo :attribute deve ser um texto.',
    'unique' => 'O campo :attribute já está em uso.',
    'attributes' => [
        'name' => 'nome',
        'email' => 'e-mail',
        'password' => 'senha',
        'password_confirmation' => 'confirmação de senha',
    ],
];
```

- [ ] **Step 4: Confirmar que os testes de auth seguem verdes com locale pt-BR**

Run: `php artisan config:clear && php artisan test tests/Feature/Auth --compact`
Expected: PASS (os testes checam redirects/sessão, não texto; devem permanecer verdes).

---

## Task 4: Landing page (`/`) — DESIGN BRIEF (ativar `frontend-design`)

**Files:**
- Modify (substituir conteúdo): `resources/js/pages/welcome.tsx`
- Test: `tests/Feature/WelcomePageTest.php` (criar)

> **Ative a skill `frontend-design`** e produza uma landing distinta e polida seguindo o brief
> abaixo. Use o tema (cores violeta vêm das CSS vars), `font-display` nos títulos grandes,
> e **reuse o gerador** para o mockup.

**Brief:**
- Página pública (o `app.tsx` já renderiza `welcome` sem layout — `case name === 'welcome': return null`). Responsiva, light/dark.
- `import { usePage, Link, Head } from '@inertiajs/react'` e `import { dashboard, login, register } from '@/routes'`. Use `const { auth } = usePage().props` (tipo já existe em `@/types`).
- **Mockup real:** importe `StoryCanvas, STORY_WIDTH, STORY_HEIGHT` de `@/components/stories/story-canvas`, `getTemplate` de `@/lib/stories/templates`, e `createDefaultStoryData` de `@/lib/stories/story-data`. Renomeie/monte dados de exemplo (semana com 3-4 dias). Escale o canvas como na página do gerador (wrapper com `transform: scale`), num "frame" de celular.
- **Vitrine:** mapeie `TEMPLATES` (de `@/lib/stories/templates`) em mini-canvases escalados (como o `TemplatePicker`).

**Seções e cópia (PT) — use exatamente estes textos:**
1. **Topbar:** marca "Stephanie" (use `AppLogo` ou wordmark Playfair). À direita: se `auth.user` → botão "Painel" (`href={dashboard()}`); senão → "Entrar" (`href={login()}`) e "Criar conta" (`href={register()}`).
2. **Hero:**
   - Título (font-display, grande): **"Stories de horários prontos em segundos"**
   - Subtítulo: **"Chega de abrir o Canva. Digite os horários livres, escolha um template e baixe a imagem pronta para postar no Instagram do seu salão."**
   - CTA primário: **"Começar agora"** (→ `login()`); secundário/outline: **"Ver como funciona"** (âncora pra seção de passos).
   - Ao lado (desktop) / abaixo (mobile): o mockup de celular com o `StoryCanvas`.
3. **Como funciona** (id `como-funciona`, 3 cards com ícone lucide):
   - **"1. Preencha os horários"** — "Adicione os dias e horários vagos da semana ou de um dia."
   - **"2. Escolha um template"** — "Estilos elegantes em tons de lilás, prontos para a sua marca."
   - **"3. Baixe e poste"** — "Exporte um PNG no formato story e publique no Instagram."
4. **Vitrine de templates:** título **"Modelos lindos, prontos para usar"** + faixa com as 5 miniaturas.
5. **CTA final:** **"Pronta para economizar tempo, Stephanie?"** + botão "Entrar".
6. **Rodapé:** **"Feito com 💜 para a Stephanie"** + ano atual.

- [ ] **Step 1: Escrever o teste feature da landing (falhando primeiro)**

Create `tests/Feature/WelcomePageTest.php`:

```php
<?php

use Inertia\Testing\AssertableInertia as Assert;

test('a landing page carrega para visitantes', function () {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('welcome'));
});
```

- [ ] **Step 2: Rodar o teste (deve passar já — a rota existe)**

Run: `php artisan test tests/Feature/WelcomePageTest.php --compact`
Expected: PASS (rota `home` já existe; o teste protege contra regressão ao reescrever a página).

- [ ] **Step 3: Implementar a landing** (ative `frontend-design`, siga o brief, cópia exata acima).

- [ ] **Step 4: Gates**

Run: `npm run types:check && npm run build && php artisan test tests/Feature/WelcomePageTest.php --compact`
Expected: tudo verde.

---

## Task 5: Auth — layout split branded + tradução (DESIGN BRIEF p/ o painel)

**Files:**
- Modify: `resources/js/layouts/auth-layout.tsx`
- Modify: `resources/js/layouts/auth/auth-split-layout.tsx`
- Modify: `resources/js/pages/auth/login.tsx`
- Modify: `resources/js/pages/auth/register.tsx`
- Modify: `resources/js/pages/auth/forgot-password.tsx`
- Modify: `resources/js/pages/auth/reset-password.tsx`
- Modify: `resources/js/pages/auth/confirm-password.tsx`

- [ ] **Step 1: Trocar o layout de auth para o split**

Em `resources/js/layouts/auth-layout.tsx`, troque a importação:

```tsx
import AuthLayoutTemplate from '@/layouts/auth/auth-split-layout';
```

(o resto do arquivo permanece igual — ele repassa `title`/`description`/`children`).

- [ ] **Step 2: Reestilizar o painel branded do split** (ative `frontend-design`)

Em `resources/js/layouts/auth/auth-split-layout.tsx`, o painel esquerdo (hoje `bg-zinc-900`)
deve virar um **painel violeta** (gradiente roxo→lilás), com:
- a marca no topo (ícone `AppLogoIcon` + "Stephanie" em `font-display`),
- no rodapé do painel, uma tagline em PT: **"Stories de horários do seu salão, em segundos."**
- (opcional, se ficar elegante) um `StoryCanvas` de exemplo escalado e suavemente posicionado.
Mantenha o lado direito (formulário) e a estrutura de `title`/`description`. No mobile o painel
fica oculto (já é `hidden lg:flex`).

- [ ] **Step 3: Traduzir `login.tsx`**

Strings: `<Head title="Entrar" />`; Label "E-mail"; Label "Senha"; link "Esqueceu a senha?";
placeholder do e-mail "voce@exemplo.com"; placeholder da senha "Senha"; "Lembrar de mim";
botão "Entrar"; rodapé "Não tem uma conta?" + link "Criar conta". E o objeto de layout:

```tsx
Login.layout = {
    title: 'Entrar na sua conta',
    description: 'Digite seu e-mail e senha abaixo para entrar',
};
```

- [ ] **Step 4: Traduzir `register.tsx`**

Strings: `<Head title="Criar conta" />`; Label "Nome" + placeholder "Nome completo";
Label "E-mail" + placeholder "voce@exemplo.com"; Label "Senha" + placeholder "Senha";
Label "Confirmar senha" + placeholder "Confirmar senha"; botão "Criar conta";
rodapé "Já tem uma conta?" + link "Entrar". E:

```tsx
Register.layout = {
    title: 'Crie sua conta',
    description: 'Preencha os dados abaixo para criar sua conta',
};
```

- [ ] **Step 5: Traduzir `forgot-password.tsx`, `reset-password.tsx`, `confirm-password.tsx`**

Traduza todas as strings visíveis (Head title, labels, botões, textos auxiliares e o objeto
`.layout = { title, description }`) usando o glossário. Sugestões de título/descrição:
- forgot: title "Esqueceu a senha?", description "Digite seu e-mail para receber o link de redefinição"; botão "Enviar link de redefinição".
- reset: title "Redefinir senha", description "Digite sua nova senha abaixo"; botão "Redefinir senha".
- confirm: title "Confirme sua senha", description "Esta é uma área protegida. Confirme sua senha para continuar"; botão "Confirmar senha".

- [ ] **Step 6: Gates**

Run: `npm run types:check && npm run build`
Expected: verde.

---

## Task 6: Traduzir o shell do app

**Files:**
- Modify: `resources/js/pages/dashboard.tsx`
- Modify: `resources/js/components/app-sidebar.tsx`
- Modify: `resources/js/components/user-menu-content.tsx`
- Modify: `resources/js/components/appearance-tabs.tsx`

- [ ] **Step 1: `dashboard.tsx`** — breadcrumb `title: 'Painel'`; `<Head title="Painel" />` (se houver); manter o conteúdo. (Opcional simples: trocar um dos placeholders por um card "Gerador de Stories" com `<Link href={stories()}>` e texto "Criar story de horários".)

- [ ] **Step 2: `app-sidebar.tsx`** — `mainNavItems`: "Dashboard" → "Painel". **Remover** `footerNavItems` (os links "Repository"/"Documentation") — deixe a lista vazia `const footerNavItems: NavItem[] = [];` e mantenha o `<NavFooter items={footerNavItems} />` (renderiza nada). Mantenha o item "Gerador de Stories".

- [ ] **Step 3: `user-menu-content.tsx`** — "Settings" → "Configurações"; "Log out" → "Sair".

- [ ] **Step 4: `appearance-tabs.tsx`** — labels: 'Light'→'Claro', 'Dark'→'Escuro', 'System'→'Sistema'.

- [ ] **Step 5: Gates**

Run: `npm run types:check && npm run build`
Expected: verde.

---

## Task 7: Traduzir Configurações

**Files:**
- Modify: `resources/js/pages/settings/profile.tsx`
- Modify: `resources/js/pages/settings/security.tsx`
- Modify: `resources/js/pages/settings/appearance.tsx`
- Modify: `resources/js/components/delete-user.tsx`
- Modify: `resources/js/layouts/settings/layout.tsx` (se tiver títulos/itens de menu em inglês)

- [ ] **Step 1: Traduzir todas as strings visíveis dessas telas** usando o glossário.
Termos comuns nessas telas: "Profile" → "Perfil", "Profile information" → "Informações do perfil",
"Update your name and email address" → "Atualize seu nome e e-mail", "Save" → "Salvar",
"Saved" → "Salvo", "Name"/"Email" → "Nome"/"E-mail", "Password" → "Senha",
"Update password" → "Atualizar senha", "Current password" → "Senha atual",
"New password" → "Nova senha", "Appearance" → "Aparência",
"Appearance settings" → "Configurações de aparência",
"Delete account" → "Excluir conta", "Delete" → "Excluir", "Cancel" → "Cancelar",
e textos de confirmação de exclusão (traduzir naturalmente).
Preserve estrutura, props, rotas e `data-test`.

- [ ] **Step 2: Gates**

Run: `npm run types:check && npm run build`
Expected: verde.

---

## Task 8: Gates finais + verificação

**Files:** —

- [ ] **Step 1: Formatar PHP**

Run: `vendor/bin/pint --dirty --format agent`
Expected: sem erros.

- [ ] **Step 2: Suite de gates completa**

```bash
npm run lint
npm run types:check
npm run build
php artisan config:clear
php artisan test tests/Feature tests/Unit --compact
```
Expected: tudo verde (mesmo conjunto de antes + `WelcomePageTest`).

- [ ] **Step 3: Verificação visual manual (para o usuário)**

`composer run dev`, abrir `/` (landing em PT, roxa, com mockup), `/login` e `/register`
(layout split violeta, em PT), logar e conferir o painel/sidebar/configurações em PT e o tema
roxo aplicado. Conferir light e dark.

---

## Self-review (feito)

- **Cobertura do spec:** tema light+dark (T1) ✓ · logo + nome (T2) ✓ · backend pt-BR + locale (T3) ✓ · landing (T4) ✓ · auth split branded + tradução (T5) ✓ · shell traduzido + limpeza footer (T6) ✓ · configurações traduzidas (T7) ✓ · gates (T8) ✓.
- **Desvio do spec:** não criamos `lang/pt_BR.json` (frontend é hardcoded PT, não usa `__()`); documentado na Task 3.
- **Placeholders:** partes mecânicas têm conteúdo exato; landing e painel auth são briefs intencionais (decisão de design delegada + skill frontend-design), com cópia PT exata.
- **Consistência:** glossário único aplicado a todas as tasks de tradução; `auth-layout.tsx` aponta pro split (T5) que é o arquivo restilizado; `AppLogoIcon` usa `currentColor` (T2) e é reusado por logo/auth/landing.
