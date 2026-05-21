import type { TemplateTheme } from '@/lib/stories/templates';

export function DayCard({
    template,
    label,
    times,
}: {
    template: TemplateTheme;
    label: string;
    times: string[];
}) {
    const { palette, fonts } = template;

    return (
        <div
            style={{
                background: palette.cardBg,
                border: `2px solid ${palette.cardBorder}`,
                borderRadius: 48,
                padding: '36px 56px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
                minWidth: 360,
            }}
        >
            <span
                style={{
                    background: palette.badgeBg,
                    color: palette.badgeText,
                    fontFamily: fonts.body,
                    fontWeight: 600,
                    fontSize: 30,
                    textTransform: 'uppercase',
                    letterSpacing: 2,
                    borderRadius: 999,
                    padding: '10px 32px',
                }}
            >
                {label}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                {times.map((time) => (
                    <span
                        key={time}
                        style={{ color: palette.timeText, fontFamily: fonts.body, fontSize: 52, fontWeight: 500 }}
                    >
                        {time}
                    </span>
                ))}
            </div>
        </div>
    );
}
