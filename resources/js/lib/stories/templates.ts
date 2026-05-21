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
