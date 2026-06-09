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

/** Identificador reservado para o template criado a partir de imagem enviada. */
export const CUSTOM_TEMPLATE_ID = 'custom';

const TEMPLATE_STORAGE_KEY = 'gerador-stories:template';
const CUSTOM_TEMPLATE_STORAGE_KEY = 'gerador-stories:custom-template';

/** Controla a paleta de texto sobre a imagem enviada. */
export type TextMode = 'light' | 'dark';

export type CustomTemplate = {
    /** Imagem já recortada para 1080×1920 (data URL JPEG). */
    image: string;
    textMode: TextMode;
};

/** Texto escuro — para imagens claras. */
const CUSTOM_DARK_TEXT_PALETTE: TemplatePalette = {
    title: '#3a2a63',
    subtitle: '#5b3f96',
    cardBg: 'rgba(255, 255, 255, 0.9)',
    cardBorder: 'rgba(255, 255, 255, 0.7)',
    badgeBg: '#8a6fc4',
    badgeText: '#ffffff',
    timeText: '#3a2a63',
};

/** Texto claro — para imagens escuras. */
const CUSTOM_LIGHT_TEXT_PALETTE: TemplatePalette = {
    title: '#ffffff',
    subtitle: '#f1e9ff',
    cardBg: 'rgba(0, 0, 0, 0.4)',
    cardBorder: 'rgba(255, 255, 255, 0.45)',
    badgeBg: '#ffffff',
    badgeText: '#3a2a63',
    timeText: '#ffffff',
};

/**
 * Monta um {@see TemplateTheme} a partir da imagem enviada pelo usuário.
 */
export function buildCustomTemplate(custom: CustomTemplate): TemplateTheme {
    return {
        id: CUSTOM_TEMPLATE_ID,
        name: 'Minha imagem',
        background: `url('${custom.image}') center / cover no-repeat`,
        decoration: 'none',
        decorationColor: 'transparent',
        fonts: { display: FONT_SERIF, body: FONT_SANS },
        palette: custom.textMode === 'light' ? CUSTOM_LIGHT_TEXT_PALETTE : CUSTOM_DARK_TEXT_PALETTE,
    };
}

export function getTemplate(id: string): TemplateTheme {
    return TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[0];
}

/**
 * Lê o template custom salvo no localStorage, validando o formato.
 */
export function loadStoredCustomTemplate(): CustomTemplate | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(CUSTOM_TEMPLATE_STORAGE_KEY);

        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as Partial<CustomTemplate>;

        if (typeof parsed.image !== 'string' || !parsed.image.startsWith('data:image')) {
            return null;
        }

        return { image: parsed.image, textMode: parsed.textMode === 'light' ? 'light' : 'dark' };
    } catch {
        return null;
    }
}

/**
 * Persiste o template custom. Retorna `false` se a quota do localStorage estourar.
 */
export function saveStoredCustomTemplate(custom: CustomTemplate): boolean {
    if (typeof window === 'undefined') {
        return false;
    }

    try {
        window.localStorage.setItem(CUSTOM_TEMPLATE_STORAGE_KEY, JSON.stringify(custom));

        return true;
    } catch {
        return false;
    }
}

/**
 * Remove o template custom salvo.
 */
export function clearStoredCustomTemplate(): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.removeItem(CUSTOM_TEMPLATE_STORAGE_KEY);
    } catch {
        // Persistência best-effort.
    }
}

/**
 * Lê o template salvo no localStorage, validando que ele ainda existe.
 */
export function loadStoredTemplateId(): string {
    if (typeof window === 'undefined') {
        return DEFAULT_TEMPLATE_ID;
    }

    const stored = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
    const isValid =
        stored === CUSTOM_TEMPLATE_ID || TEMPLATES.some((template) => template.id === stored);

    return stored && isValid ? stored : DEFAULT_TEMPLATE_ID;
}

/**
 * Persiste o template escolhido no localStorage.
 */
export function saveStoredTemplateId(id: string): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(TEMPLATE_STORAGE_KEY, id);
    } catch {
        // Persistência best-effort.
    }
}
