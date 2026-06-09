import { Head, router } from '@inertiajs/react';
import { Download, Save } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { update as updateStory } from '@/actions/App/Http/Controllers/StoryController';
import { StoryCanvas, STORY_HEIGHT, STORY_WIDTH } from '@/components/stories/story-canvas';
import { StoryForm } from '@/components/stories/story-form';
import { Button } from '@/components/ui/button';
import { buildStoryFilename, exportStoryToPng } from '@/lib/stories/export-png';
import { loadStoredStoryData, saveStoredStoryData } from '@/lib/stories/story-data';
import type {StoryData} from '@/lib/stories/story-data';
import {
    buildCustomTemplate,
    clearStoredCustomTemplate,
    CUSTOM_TEMPLATE_ID,
    DEFAULT_TEMPLATE_ID,
    loadStoredCustomTemplate,
    loadStoredTemplateId,
    saveStoredCustomTemplate,
    saveStoredTemplateId,
    TEMPLATES,
} from '@/lib/stories/templates';
import type { CustomTemplate } from '@/lib/stories/templates';
import { stories } from '@/routes';

const PREVIEW_WIDTH = 320;

type SavedStory = {
    data: StoryData;
    templateId: string;
    custom: CustomTemplate | null;
};

export default function StoriesIndex({ saved }: { saved: SavedStory | null }) {
    const [data, setData] = useState<StoryData>(() => saved?.data ?? loadStoredStoryData());
    const [custom, setCustom] = useState<CustomTemplate | null>(
        () => saved?.custom ?? loadStoredCustomTemplate(),
    );
    const [templateId, setTemplateId] = useState<string>(() => {
        const stored = saved?.templateId ?? loadStoredTemplateId();
        const hasCustom = Boolean(saved?.custom ?? loadStoredCustomTemplate());

        return stored === CUSTOM_TEMPLATE_ID && !hasCustom ? DEFAULT_TEMPLATE_ID : stored;
    });
    const [exporting, setExporting] = useState(false);
    const [saving, setSaving] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    const templates = useMemo(
        () => (custom ? [...TEMPLATES, buildCustomTemplate(custom)] : TEMPLATES),
        [custom],
    );
    const template = templates.find((item) => item.id === templateId) ?? templates[0];
    const previewScale = PREVIEW_WIDTH / STORY_WIDTH;

    const handleCustomTemplateChange = (next: CustomTemplate) => {
        if (!saveStoredCustomTemplate(next)) {
            toast.error('Não foi possível salvar a imagem (armazenamento cheio). Tente uma imagem menor.');

            return;
        }

        setCustom(next);
        setTemplateId(CUSTOM_TEMPLATE_ID);
    };

    const handleRemoveCustomTemplate = () => {
        clearStoredCustomTemplate();
        setCustom(null);
        setTemplateId((current) => (current === CUSTOM_TEMPLATE_ID ? DEFAULT_TEMPLATE_ID : current));
    };

    useEffect(() => {
        saveStoredStoryData(data);
    }, [data]);

    useEffect(() => {
        saveStoredTemplateId(templateId);
    }, [templateId]);

    const handleChange = (patch: Partial<StoryData>) => {
        setData((previous) => ({ ...previous, ...patch }));
    };

    const handleDownload = async () => {
        if (!exportRef.current) {
            return;
        }

        setExporting(true);

        try {
            await exportStoryToPng(exportRef.current, buildStoryFilename());
        } finally {
            setExporting(false);
        }
    };

    const handleSave = () => {
        setSaving(true);

        router.put(
            updateStory.url(),
            {
                data,
                template_id: templateId,
                custom: custom ? { image: custom.image, textMode: custom.textMode } : null,
            },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => toast.success('Horários salvos no servidor.'),
                onError: () => toast.error('Não foi possível salvar. Tente novamente.'),
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <>
            <Head title="Gerador de Stories" />

            <div className="flex flex-col gap-8 p-4 lg:flex-row">
                <div className="flex-1">
                    <StoryForm
                        data={data}
                        onChange={handleChange}
                        templateId={templateId}
                        onTemplateChange={setTemplateId}
                        templates={templates}
                        customTemplate={custom}
                        onCustomTemplateChange={handleCustomTemplateChange}
                        onRemoveCustomTemplate={handleRemoveCustomTemplate}
                    />
                </div>

                <div className="flex flex-col items-center gap-4">
                    <div
                        style={{ width: PREVIEW_WIDTH, height: STORY_HEIGHT * previewScale }}
                        className="overflow-hidden rounded-[2rem] border-4 border-foreground/10 shadow-xl"
                    >
                        <div
                            style={{
                                width: STORY_WIDTH,
                                height: STORY_HEIGHT,
                                transform: `scale(${previewScale})`,
                                transformOrigin: 'top left',
                            }}
                        >
                            <StoryCanvas template={template} data={data} />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button onClick={handleSave} disabled={saving} variant="secondary">
                            <Save className="mr-2 size-4" />
                            {saving ? 'Salvando…' : 'Salvar'}
                        </Button>

                        <Button onClick={handleDownload} disabled={exporting}>
                            <Download className="mr-2 size-4" />
                            {exporting ? 'Gerando…' : 'Baixar PNG'}
                        </Button>
                    </div>
                </div>
            </div>

            <div aria-hidden style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none' }}>
                <div ref={exportRef}>
                    <StoryCanvas template={template} data={data} />
                </div>
            </div>
        </>
    );
}

StoriesIndex.layout = {
    breadcrumbs: [{ title: 'Gerador de Stories', href: stories() }],
};
