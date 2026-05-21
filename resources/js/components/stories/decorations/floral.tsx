export function FloralDecoration({ color }: { color: string }) {
    return (
        <svg
            viewBox="0 0 1080 1920"
            width={1080}
            height={1920}
            style={{ position: 'absolute', inset: 0 }}
            aria-hidden
        >
            <g fill="none" stroke={color} strokeWidth={4} strokeLinecap="round">
                <path d="M80 120 C 180 60, 280 120, 300 240 C 200 200, 120 220, 80 120 Z" />
                <path d="M120 160 C 180 200, 200 280, 160 360" />
                <path d="M300 240 C 360 220, 420 250, 440 320" />
                <circle cx="300" cy="240" r="14" fill={color} stroke="none" />
                <path d="M1000 1800 C 900 1860, 800 1800, 780 1680 C 880 1720, 960 1700, 1000 1800 Z" />
                <path d="M960 1760 C 900 1720, 880 1640, 920 1560" />
                <path d="M780 1680 C 720 1700, 660 1670, 640 1600" />
                <circle cx="780" cy="1680" r="14" fill={color} stroke="none" />
            </g>
        </svg>
    );
}
