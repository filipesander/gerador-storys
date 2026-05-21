import { StoryCanvas, STORY_HEIGHT, STORY_WIDTH } from '@/components/stories/story-canvas';
import type { StoryData } from '@/lib/stories/story-data';
import type { TemplateTheme } from '@/lib/stories/templates';
import { cn } from '@/lib/utils';

const THUMB_WIDTH = 96;

export function TemplatePicker({
    templates,
    value,
    onChange,
    data,
}: {
    templates: TemplateTheme[];
    value: string;
    onChange: (id: string) => void;
    data: StoryData;
}) {
    const scale = THUMB_WIDTH / STORY_WIDTH;

    return (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {templates.map((template) => (
                <button
                    type="button"
                    key={template.id}
                    onClick={() => onChange(template.id)}
                    aria-pressed={value === template.id}
                    className={cn(
                        'overflow-hidden rounded-xl border-2 transition',
                        value === template.id ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30',
                    )}
                >
                    <div style={{ width: THUMB_WIDTH, height: STORY_HEIGHT * scale }} className="overflow-hidden">
                        <div
                            style={{
                                width: STORY_WIDTH,
                                height: STORY_HEIGHT,
                                transform: `scale(${scale})`,
                                transformOrigin: 'top left',
                            }}
                        >
                            <StoryCanvas template={template} data={data} />
                        </div>
                    </div>
                    <span className="block py-1 text-center text-xs">{template.name}</span>
                </button>
            ))}
        </div>
    );
}
