import { toPng } from 'html-to-image';

export function buildAgendaFilename(
    professional: string,
    period: string,
    date: string,
): string {
    return `agenda-${professional}-${period}-${date}.png`;
}

export async function exportAgendaToPng(
    node: HTMLElement,
    filename: string,
): Promise<void> {
    if (document.fonts?.ready) {
        await document.fonts.ready;
    }

    const dataUrl = await toPng(node, {
        width: node.offsetWidth,
        height: node.offsetHeight,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
    });

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
}
