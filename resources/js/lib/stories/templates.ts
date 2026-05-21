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

export function getTemplate(id: string): TemplateTheme {
    return TEMPLATES.find((template) => template.id === id) ?? TEMPLATES[0];
}
