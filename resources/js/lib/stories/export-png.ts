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
