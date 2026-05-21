export function LeavesDecoration({ color }: { color: string }) {
    return (
        <svg
            viewBox="0 0 1080 1920"
            width={1080}
            height={1920}
            style={{ position: 'absolute', inset: 0 }}
            aria-hidden
        >
            <g fill={color} stroke="none">
                <path d="M90 90 C 160 110, 200 180, 180 260 C 120 230, 80 170 90 90 Z" />
                <path d="M180 180 C 250 190, 300 250, 300 330 C 230 310, 190 250 180 180 Z" />
                <path d="M990 1830 C 920 1810, 880 1740, 900 1660 C 960 1690, 1000 1750 990 1830 Z" />
                <path d="M900 1740 C 830 1730, 780 1670, 780 1590 C 850 1610, 890 1670 900 1740 Z" />
            </g>
        </svg>
    );
}
