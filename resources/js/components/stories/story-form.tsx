import { X } from 'lucide-react';
import { useState } from 'react';
import { TemplatePicker } from '@/components/stories/template-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    createDaySlot,
    defaultTitleForMode,
    normalizeTime,
    WEEKDAYS,
    WEEKDAY_LABELS
    
    
    
    
} from '@/lib/stories/story-data';
import type {DaySlot, StoryData, StoryMode, Weekday} from '@/lib/stories/story-data';
import { TEMPLATES } from '@/lib/stories/templates';

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
}: {
    data: StoryData;
    onChange: (patch: Partial<StoryData>) => void;
    templateId: string;
    onTemplateChange: (id: string) => void;
}) {
    const setMode = (mode: StoryMode) => {
        onChange({ mode, title: defaultTitleForMode(mode) });
    };

    const updateSlot = (id: string, patch: Partial<DaySlot>) => {
        onChange({
            weekSlots: data.weekSlots.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)),
        });
    };

    const addSlot = () => {
        const used = new Set(data.weekSlots.map((slot) => slot.weekday));
        const next = WEEKDAYS.find((weekday) => !used.has(weekday)) ?? 'segunda';
        onChange({ weekSlots: [...data.weekSlots, createDaySlot(next)] });
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
                    {data.weekSlots.map((slot) => (
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

            <div className="space-y-2">
                <Label>Template</Label>
                <TemplatePicker templates={TEMPLATES} value={templateId} onChange={onTemplateChange} data={data} />
            </div>
        </div>
    );
}
