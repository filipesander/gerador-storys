import { DayCard } from '@/components/stories/day-card';
import { Decoration } from '@/components/stories/decorations';
import { WEEKDAY_LABELS  } from '@/lib/stories/story-data';
import type {StoryData} from '@/lib/stories/story-data';
import type { TemplateTheme } from '@/lib/stories/templates';

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

function formatDate(iso: string): string {
    if (!iso) {
        return '';
    }

    const [year, month, day] = iso.split('-');

    return `${day}/${month}/${year}`;
}

export function StoryCanvas({ template, data }: { template: TemplateTheme; data: StoryData }) {
    const { palette, fonts } = template;
    const weekCards = data.weekSlots.filter((slot) => slot.times.length > 0);

    return (
        <div
            style={{
                width: STORY_WIDTH,
                height: STORY_HEIGHT,
                background: template.background,
                fontFamily: fonts.body,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <Decoration decoration={template.decoration} color={template.decorationColor} />

            <div
                style={{
                    position: 'relative',
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    padding: '120px 80px',
                }}
            >
                <h1
                    style={{
                        fontFamily: fonts.display,
                        color: palette.title,
                        fontSize: 96,
                        lineHeight: 1.05,
                        fontWeight: 700,
                        textAlign: 'center',
                        margin: 0,
                    }}
                >
                    {data.title}
                </h1>

                {data.mode === 'dia' && (
                    <p
                        style={{
                            color: palette.subtitle,
                            fontSize: 40,
                            marginTop: 16,
                            letterSpacing: 4,
                            textTransform: 'uppercase',
                        }}
                    >
                        {formatDate(data.date)}
                    </p>
                )}

                <div
                    style={{
                        marginTop: 80,
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: 40,
                        width: '100%',
                    }}
                >
                    {data.mode === 'semana' ? (
                        weekCards.map((slot) => (
                            <DayCard
                                key={slot.id}
                                template={template}
                                label={WEEKDAY_LABELS[slot.weekday]}
                                times={slot.times}
                            />
                        ))
                    ) : (
                        <DayCard template={template} label="Disponíveis" times={data.dayTimes} />
                    )}
                </div>
            </div>
        </div>
    );
}
