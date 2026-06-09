import { STORY_HEIGHT, STORY_WIDTH } from '@/components/stories/story-canvas';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ACCEPTED_IMAGE_ACCEPT = ACCEPTED_IMAGE_TYPES.join(',');

/** Limite de 10 MB para o arquivo enviado. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Dimensões mínimas para garantir qualidade aceitável no story 1080×1920. */
export const MIN_IMAGE_WIDTH = 600;
export const MIN_IMAGE_HEIGHT = 1066;

/** Proporção do story (9:16). */
export const STORY_ASPECT = STORY_WIDTH / STORY_HEIGHT;

export type CropAreaPixels = { x: number; y: number; width: number; height: number };

export type LoadedImage = { src: string; width: number; height: number };

/**
 * Valida tipo e tamanho do arquivo antes de carregá-lo.
 * Retorna a mensagem de erro ou `null` quando válido.
 */
export function validateImageFile(file: File): string | null {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        return 'Formato inválido. Envie uma imagem JPG, PNG ou WEBP.';
    }

    if (file.size > MAX_IMAGE_BYTES) {
        return 'Imagem muito grande. O limite é 10 MB.';
    }

    return null;
}

/**
 * Valida as dimensões mínimas da imagem já carregada.
 * Retorna a mensagem de erro ou `null` quando válido.
 */
export function validateImageDimensions(image: LoadedImage): string | null {
    if (image.width < MIN_IMAGE_WIDTH || image.height < MIN_IMAGE_HEIGHT) {
        return `Imagem muito pequena. Use pelo menos ${MIN_IMAGE_WIDTH}×${MIN_IMAGE_HEIGHT}px.`;
    }

    return null;
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
        reader.readAsDataURL(file);
    });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Não foi possível carregar a imagem.'));
        image.src = src;
    });
}

/**
 * Lê o arquivo como data URL e devolve as dimensões reais da imagem.
 */
export async function loadImageFromFile(file: File): Promise<LoadedImage> {
    const src = await readFileAsDataUrl(file);
    const image = await loadImageElement(src);

    return { src, width: image.naturalWidth, height: image.naturalHeight };
}

/**
 * Recorta a área selecionada e renderiza num canvas 1080×1920,
 * devolvendo um data URL JPEG leve o suficiente para o localStorage.
 */
export async function cropToStoryDataUrl(src: string, area: CropAreaPixels): Promise<string> {
    const image = await loadImageElement(src);
    const canvas = document.createElement('canvas');
    canvas.width = STORY_WIDTH;
    canvas.height = STORY_HEIGHT;

    const context = canvas.getContext('2d');

    if (!context) {
        throw new Error('Canvas indisponível neste navegador.');
    }

    context.imageSmoothingQuality = 'high';
    context.drawImage(
        image,
        area.x,
        area.y,
        area.width,
        area.height,
        0,
        0,
        STORY_WIDTH,
        STORY_HEIGHT,
    );

    return canvas.toDataURL('image/jpeg', 0.85);
}
