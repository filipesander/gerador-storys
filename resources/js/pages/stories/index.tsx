import type { FormDataConvertible } from '@inertiajs/core';
import { Head, router } from '@inertiajs/react';
import { Download, Save } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
    destroy as destroyStory,
    store as storeStory,
    update as updateStory,
} from '@/actions/App/Http/Controllers/StoryController';
import { StoryCanvas, STORY_HEIGHT, STORY_WIDTH } from '@/components/stories/story-canvas';
import { StoryForm } from '@/components/stories/story-form';
import { StoryList } from '@/components/stories/story-list';
import type { ServerStory } from '@/components/stories/story-list';
import { Button } from '@/components/ui/button';
import { buildStoryFilename, exportStoryToPng } from '@/lib/stories/export-png';
import { dataUrlToFile } from '@/lib/stories/image-crop';
import { createDefaultStoryData } from '@/lib/stories/story-data';
import type { StoryData } from '@/lib/stories/story-data';
import {
    buildCustomTemplate,
    CUSTOM_TEMPLATE_ID,
    DEFAULT_TEMPLATE_ID,
    TEMPLATES,
} from '@/lib/stories/templates';
import type { CustomTemplate } from '@/lib/stories/templates';
import { stories as storiesRoute } from '@/routes';

const PREVIEW_WIDTH = 320;

export default function StoriesIndex({ stories }: { stories: ServerStory[] }) {
    const initial = stories[0] ?? null;

    const [selectedId, setSelectedId] = useState<number | null>(initial?.id ?? null);
    const [data, setData] = useState<StoryData>(initial?.content ?? createDefaultStoryData());
    const [templateId, setTemplateId] = useState<string>(initial?.templateId ?? DEFAULT_TEMPLATE_ID);
    const [custom, setCustom] = useState<CustomTemplate | null>(initial?.custom ?? null);
    const [exporting, setExporting] = useState(false);
    const [saving, setSaving] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    const templates = useMemo(
        () => (custom ? [...TEMPLATES, buildCustomTemplate(custom)] : TEMPLATES),
        [custom],
    );
    const template = templates.find((item) => item.id === templateId) ?? templates[0];
    const previewScale = PREVIEW_WIDTH / STORY_WIDTH;

    const loadStory = (story: ServerStory) => {
        setData(story.content);
        setTemplateId(story.templateId);
        setCustom(story.custom);
        setSelectedId(story.id);
    };

    const handleNew = () => {
        setData(createDefaultStoryData());
        setTemplateId(DEFAULT_TEMPLATE_ID);
        setCustom(null);
        setSelectedId(null);
    };

    const handleSelect = (id: number) => {
        const story = stories.find((item) => item.id === id);

        if (story) {
            loadStory(story);
        }
    };

    const handleChange = (patch: Partial<StoryData>) => {
        setData((previous) => ({ ...previous, ...patch }));
    };

    const handleCustomTemplateChange = (next: CustomTemplate) => {
        setCustom(next);
        setTemplateId(CUSTOM_TEMPLATE_ID);
    };

    const handleRemoveCustomTemplate = () => {
        setCustom(null);
        setTemplateId((current) => (current === CUSTOM_TEMPLATE_ID ? DEFAULT_TEMPLATE_ID : current));
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

    const handleSave = async () => {
        setSaving(true);

        const payload: Record<string, FormDataConvertible> = {
            title: data.title,
            content: JSON.stringify(data),
            template_id: templateId,
        };

        if (custom) {
            payload.text_mode = custom.textMode;

            if (custom.image.startsWith('data:')) {
                try {
                    payload.image = await dataUrlToFile(custom.image);
                } catch {
                    toast.error('Não foi possível processar a imagem.');
                    setSaving(false);

                    return;
                }
            }
        }

        const options = {
            forceFormData: true,
            preserveScroll: true,
            preserveState: true,
            onError: () => toast.error('Não foi possível salvar. Verifique os campos e tente novamente.'),
            onFinish: () => setSaving(false),
        } as const;

        if (selectedId === null) {
            router.post(storeStory.url(), payload, {
                ...options,
                onSuccess: (page) => {
                    const fresh = (page.props as unknown as { stories: ServerStory[] }).stories;

                    if (fresh.length > 0) {
                        loadStory(fresh[0]);
                    }
                },
            });

            return;
        }

        router.post(updateStory.url(selectedId), { ...payload, _method: 'put' }, options);
    };

    const handleDelete = (id: number) => {
        if (!window.confirm('Excluir este story? Esta ação não pode ser desfeita.')) {
            return;
        }

        router.delete(destroyStory.url(id), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (page) => {
                if (id !== selectedId) {
                    return;
                }

                const fresh = (page.props as unknown as { stories: ServerStory[] }).stories;

                if (fresh.length > 0) {
                    loadStory(fresh[0]);
                } else {
                    handleNew();
                }
            },
            onError: () => toast.error('Não foi possível excluir. Tente novamente.'),
        });
    };

    return (
        <>
            <Head title="Gerador de Stories" />

            <div className="flex flex-col gap-8 p-4 lg:flex-row">
                <StoryList
                    stories={stories}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                    onNew={handleNew}
                    onDelete={handleDelete}
                />

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
                            {saving ? 'Salvando…' : selectedId === null ? 'Criar story' : 'Salvar'}
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
    breadcrumbs: [{ title: 'Gerador de Stories', href: storiesRoute() }],
};
