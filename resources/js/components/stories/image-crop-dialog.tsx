import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cropToStoryDataUrl, STORY_ASPECT } from '@/lib/stories/image-crop';
import type { CropAreaPixels } from '@/lib/stories/image-crop';
import type { TextMode } from '@/lib/stories/templates';

type ImageCropDialogProps = {
    /** Fonte da imagem a recortar; `null` mantém o modal fechado. */
    imageSrc: string | null;
    initialTextMode?: TextMode;
    onCancel: () => void;
    onConfirm: (dataUrl: string, textMode: TextMode) => void;
};

export function ImageCropDialog({
    imageSrc,
    initialTextMode = 'dark',
    onCancel,
    onConfirm,
}: ImageCropDialogProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [textMode, setTextMode] = useState<TextMode>(initialTextMode);
    const [area, setArea] = useState<CropAreaPixels | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleCropComplete = useCallback((_: unknown, pixels: CropAreaPixels) => {
        setArea(pixels);
    }, []);

    const handleConfirm = async () => {
        if (!imageSrc || !area) {
            return;
        }

        setProcessing(true);

        try {
            const dataUrl = await cropToStoryDataUrl(imageSrc, area);
            onConfirm(dataUrl, textMode);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Dialog
            open={imageSrc !== null}
            onOpenChange={(open) => {
                if (!open && !processing) {
                    onCancel();
                }
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Ajustar imagem</DialogTitle>
                    <DialogDescription>
                        Arraste e use o zoom para enquadrar. O formato é 9:16 (1080×1920).
                    </DialogDescription>
                </DialogHeader>

                <div className="relative h-[420px] w-full overflow-hidden rounded-lg bg-muted">
                    {imageSrc && (
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            minZoom={1}
                            maxZoom={3}
                            aspect={STORY_ASPECT}
                            restrictPosition
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={handleCropComplete}
                        />
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="crop-zoom">Zoom</Label>
                    <input
                        id="crop-zoom"
                        type="range"
                        min={1}
                        max={3}
                        step={0.01}
                        value={zoom}
                        onChange={(event) => setZoom(Number(event.target.value))}
                        className="w-full accent-primary"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Cor do texto</Label>
                    <ToggleGroup
                        type="single"
                        value={textMode}
                        onValueChange={(value) => value && setTextMode(value as TextMode)}
                        variant="outline"
                    >
                        <ToggleGroupItem value="dark">Texto escuro</ToggleGroupItem>
                        <ToggleGroupItem value="light">Texto claro</ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onCancel} disabled={processing}>
                        Cancelar
                    </Button>
                    <Button type="button" onClick={handleConfirm} disabled={processing || !area}>
                        {processing ? 'Processando…' : 'Aplicar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
