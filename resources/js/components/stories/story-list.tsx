import { Plus, Trash2 } from 'lucide-react';
import { StoryCanvas, STORY_HEIGHT, STORY_WIDTH } from '@/components/stories/story-canvas';
import { Button } from '@/components/ui/button';
import type { StoryData } from '@/lib/stories/story-data';
import {
    buildCustomTemplate,
    CUSTOM_TEMPLATE_ID,
    TEMPLATES,
} from '@/lib/stories/templates';
import type { CustomTemplate, TemplateTheme } from '@/lib/stories/templates';
import { cn } from '@/lib/utils';

export type ServerStory = {
    id: number;
    title: string;
    content: StoryData;
    templateId: string;
    custom: CustomTemplate | null;
    updatedAt: string | null;
};

const THUMB_WIDTH = 64;

function resolveTemplate(templateId: string, custom: CustomTemplate | null): TemplateTheme {
    if (templateId === CUSTOM_TEMPLATE_ID && custom) {
        return buildCustomTemplate(custom);
    }

    return TEMPLATES.find((template) => template.id === templateId) ?? TEMPLATES[0];
}

function formatUpdatedAt(iso: string | null): string {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function StoryList({
    stories,
    selectedId,
    onSelect,
    onNew,
    onDelete,
}: {
    stories: ServerStory[];
    selectedId: number | null;
    onSelect: (id: number) => void;
    onNew: () => void;
    onDelete: (id: number) => void;
}) {
    const scale = THUMB_WIDTH / STORY_WIDTH;

    return (
        <div className="flex w-full flex-col gap-3 lg:w-64">
            <Button type="button" variant="outline" onClick={onNew} className="justify-start">
                <Plus className="mr-2 size-4" />
                Novo story
            </Button>

            {stories.length === 0 ? (
                <p className="px-1 text-sm text-muted-foreground">
                    Nenhum story salvo ainda. Crie o primeiro abaixo.
                </p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {stories.map((story) => {
                        const template = resolveTemplate(story.templateId, story.custom);
                        const isSelected = story.id === selectedId;

                        return (
                            <li key={story.id}>
                                <div
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl border-2 p-2 transition',
                                        isSelected
                                            ? 'border-primary bg-primary/5'
                                            : 'border-transparent hover:border-muted-foreground/30',
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() => onSelect(story.id)}
                                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                        aria-pressed={isSelected}
                                    >
                                        <div
                                            style={{ width: THUMB_WIDTH, height: STORY_HEIGHT * scale }}
                                            className="shrink-0 overflow-hidden rounded-md border border-foreground/10"
                                        >
                                            <div
                                                style={{
                                                    width: STORY_WIDTH,
                                                    height: STORY_HEIGHT,
                                                    transform: `scale(${scale})`,
                                                    transformOrigin: 'top left',
                                                }}
                                            >
                                                <StoryCanvas template={template} data={story.content} />
                                            </div>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">{story.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatUpdatedAt(story.updatedAt)}
                                            </p>
                                        </div>
                                    </button>

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="shrink-0 text-muted-foreground hover:text-destructive"
                                        onClick={() => onDelete(story.id)}
                                        aria-label={`Excluir ${story.title}`}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
