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

/**
 * Ordena os slots na ordem da semana (segunda → domingo),
 * independente da ordem em que foram adicionados.
 */
export function sortSlotsByWeekday(slots: DaySlot[]): DaySlot[] {
    return [...slots].sort((a, b) => WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday));
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

const STORAGE_KEY = 'gerador-stories:data';

/**
 * Lê os dados salvos no localStorage, validando o formato.
 * Retorna os dados padrão quando não há nada salvo ou o conteúdo é inválido.
 */
export function loadStoredStoryData(): StoryData {
    if (typeof window === 'undefined') {
        return createDefaultStoryData();
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return createDefaultStoryData();
        }

        const parsed = JSON.parse(raw) as Partial<StoryData>;
        const fallback = createDefaultStoryData();

        return {
            mode: parsed.mode === 'dia' ? 'dia' : 'semana',
            title: typeof parsed.title === 'string' ? parsed.title : fallback.title,
            weekSlots: Array.isArray(parsed.weekSlots) ? parsed.weekSlots : fallback.weekSlots,
            date: typeof parsed.date === 'string' ? parsed.date : fallback.date,
            dayTimes: Array.isArray(parsed.dayTimes) ? parsed.dayTimes : fallback.dayTimes,
        };
    } catch {
        return createDefaultStoryData();
    }
}

/**
 * Persiste os dados do story no localStorage.
 */
export function saveStoredStoryData(data: StoryData): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // Ignora falhas de quota/modo privado — persistência é best-effort.
    }
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
