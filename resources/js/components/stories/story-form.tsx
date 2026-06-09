import { ImagePlus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { ImageCropDialog } from '@/components/stories/image-crop-dialog';
import { TemplatePicker } from '@/components/stories/template-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    ACCEPTED_IMAGE_ACCEPT,
    loadImageFromFile,
    validateImageDimensions,
    validateImageFile,
} from '@/lib/stories/image-crop';
import {
    createDaySlot,
    defaultTitleForMode,
    normalizeTime,
    sortSlotsByWeekday,
    WEEKDAYS,
    WEEKDAY_LABELS,
} from '@/lib/stories/story-data';
import type {DaySlot, StoryData, StoryMode, Weekday} from '@/lib/stories/story-data';
import type { CustomTemplate, TemplateTheme, TextMode } from '@/lib/stories/templates';

function TimesEditor({ times, onChange }: { times: string[]; onChange: (times: string[]) => void }) {
    const [draft, setDraft] = useState('');

    const add = () => {
        const time = normalizeTime(draft);

        if (time !== '' && !times.includes(time)) {
            onChange([...times, time].sort());
        }

        setDraft('');
    };

    return (
        <div>
            <div className="flex gap-2">
                <Input
                    value={draft}
                    placeholder="08:00"
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            add();
                        }
                    }}
                />
                <Button type="button" variant="secondary" onClick={add}>
                    Adicionar
                </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
                {times.map((time) => (
                    <button
                        type="button"
                        key={time}
                        onClick={() => onChange(times.filter((value) => value !== time))}
                        className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground hover:bg-muted-foreground/20"
                    >
                        {time} ✕
                    </button>
                ))}
            </div>
        </div>
    );
}

export function StoryForm({
    data,
    onChange,
    templateId,
    onTemplateChange,
    templates,
    customTemplate,
    onCustomTemplateChange,
    onRemoveCustomTemplate,
}: {
    data: StoryData;
    onChange: (patch: Partial<StoryData>) => void;
    templateId: string;
    onTemplateChange: (id: string) => void;
    templates: TemplateTheme[];
    customTemplate: CustomTemplate | null;
    onCustomTemplateChange: (custom: CustomTemplate) => void;
    onRemoveCustomTemplate: () => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        const fileError = validateImageFile(file);

        if (fileError) {
            toast.error(fileError);

            return;
        }

        try {
            const loaded = await loadImageFromFile(file);
            const dimensionError = validateImageDimensions(loaded);

            if (dimensionError) {
                toast.error(dimensionError);

                return;
            }

            setCropSrc(loaded.src);
        } catch {
            toast.error('Não foi possível abrir a imagem.');
        }
    };

    const handleCropConfirm = (dataUrl: string, textMode: TextMode) => {
        onCustomTemplateChange({ image: dataUrl, textMode });
        setCropSrc(null);
    };

    const setMode = (mode: StoryMode) => {
        onChange({ mode, title: defaultTitleForMode(mode) });
    };

    const updateSlot = (id: string, patch: Partial<DaySlot>) => {
        onChange({
            weekSlots: sortSlotsByWeekday(
                data.weekSlots.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)),
            ),
        });
    };

    const addSlot = () => {
        const used = new Set(data.weekSlots.map((slot) => slot.weekday));
        const next = WEEKDAYS.find((weekday) => !used.has(weekday)) ?? 'segunda';
        onChange({ weekSlots: sortSlotsByWeekday([...data.weekSlots, createDaySlot(next)]) });
    };

    const removeSlot = (id: string) => {
        onChange({ weekSlots: data.weekSlots.filter((slot) => slot.id !== id) });
    };

    return (
        <div className="space-y-6">
            <ToggleGroup
                type="single"
                value={data.mode}
                onValueChange={(value) => value && setMode(value as StoryMode)}
                variant="outline"
            >
                <ToggleGroupItem value="semana">Semana</ToggleGroupItem>
                <ToggleGroupItem value="dia">Dia</ToggleGroupItem>
            </ToggleGroup>

            <div className="space-y-2">
                <Label htmlFor="story-title">Título</Label>
                <Input
                    id="story-title"
                    value={data.title}
                    onChange={(event) => onChange({ title: event.target.value })}
                />
            </div>

            {data.mode === 'semana' ? (
                <div className="space-y-3">
                    {sortSlotsByWeekday(data.weekSlots).map((slot) => (
                        <Card key={slot.id}>
                            <CardContent className="space-y-3 p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <Select
                                        value={slot.weekday}
                                        onValueChange={(weekday) => updateSlot(slot.id, { weekday: weekday as Weekday })}
                                    >
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {WEEKDAYS.map((weekday) => (
                                                <SelectItem key={weekday} value={weekday}>
                                                    {WEEKDAY_LABELS[weekday]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSlot(slot.id)}>
                                        <X className="size-4" />
                                    </Button>
                                </div>
                                <TimesEditor times={slot.times} onChange={(times) => updateSlot(slot.id, { times })} />
                            </CardContent>
                        </Card>
                    ))}
                    <Button type="button" variant="outline" onClick={addSlot}>
                        + Adicionar dia
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label htmlFor="story-date">Data</Label>
                        <Input
                            id="story-date"
                            type="date"
                            value={data.date}
                            onChange={(event) => onChange({ date: event.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Horários</Label>
                        <TimesEditor times={data.dayTimes} onChange={(dayTimes) => onChange({ dayTimes })} />
                    </div>
                </div>
            )}

            <div className="space-y-3">
                <Label>Template</Label>
                <TemplatePicker templates={templates} value={templateId} onChange={onTemplateChange} data={data} />

                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_IMAGE_ACCEPT}
                    className="hidden"
                    onChange={handleFileChange}
                />

                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImagePlus className="mr-2 size-4" />
                        {customTemplate ? 'Trocar imagem' : 'Enviar imagem'}
                    </Button>

                    {customTemplate && (
                        <>
                            <ToggleGroup
                                type="single"
                                value={customTemplate.textMode}
                                onValueChange={(value) =>
                                    value &&
                                    onCustomTemplateChange({
                                        ...customTemplate,
                                        textMode: value as TextMode,
                                    })
                                }
                                variant="outline"
                                size="sm"
                            >
                                <ToggleGroupItem value="dark">Texto escuro</ToggleGroupItem>
                                <ToggleGroupItem value="light">Texto claro</ToggleGroupItem>
                            </ToggleGroup>

                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={onRemoveCustomTemplate}
                            >
                                Remover
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <ImageCropDialog
                imageSrc={cropSrc}
                initialTextMode={customTemplate?.textMode ?? 'dark'}
                onCancel={() => setCropSrc(null)}
                onConfirm={handleCropConfirm}
            />
        </div>
    );
}
