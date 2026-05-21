import { Head } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useRef, useState } from 'react';
import { StoryCanvas, STORY_HEIGHT, STORY_WIDTH } from '@/components/stories/story-canvas';
import { StoryForm } from '@/components/stories/story-form';
import { Button } from '@/components/ui/button';
import { buildStoryFilename, exportStoryToPng } from '@/lib/stories/export-png';
import { createDefaultStoryData  } from '@/lib/stories/story-data';
import type {StoryData} from '@/lib/stories/story-data';
import { DEFAULT_TEMPLATE_ID, getTemplate } from '@/lib/stories/templates';
import { stories } from '@/routes';

const PREVIEW_WIDTH = 320;

export default function StoriesIndex() {
    const [data, setData] = useState<StoryData>(() => createDefaultStoryData());
    const [templateId, setTemplateId] = useState<string>(DEFAULT_TEMPLATE_ID);
    const [exporting, setExporting] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    const template = getTemplate(templateId);
    const previewScale = PREVIEW_WIDTH / STORY_WIDTH;

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

                    <Button onClick={handleDownload} disabled={exporting}>
                        <Download className="mr-2 size-4" />
                        {exporting ? 'Gerando…' : 'Baixar PNG'}
                    </Button>
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
