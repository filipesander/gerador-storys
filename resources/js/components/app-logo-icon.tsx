import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path
                fill="currentColor"
                d="M16 3c1.4 2.2 1.4 4.6 0 6.8C14.6 7.6 14.6 5.2 16 3Zm0 26c-1.4-2.2-1.4-4.6 0-6.8 1.4 2.2 1.4 4.6 0 6.8ZM3 16c2.2-1.4 4.6-1.4 6.8 0-2.2 1.4-4.6 1.4-6.8 0Zm19.2 0c2.2-1.4 4.6-1.4 6.8 0-2.2 1.4-4.6 1.4-6.8 0ZM6.7 6.7c2.6.2 4.6 1.6 5.6 3.8-2.6-.2-4.6-1.6-5.6-3.8Zm13 13c2.6.2 4.6 1.6 5.6 3.8-2.6-.2-4.6-1.6-5.6-3.8Zm5.6-13c-1 2.2-3 3.6-5.6 3.8 1-2.2 3-3.6 5.6-3.8Zm-13 13c-1 2.2-3 3.6-5.6 3.8 1-2.2 3-3.6 5.6-3.8Z"
            />
            <circle cx="16" cy="16" r="3.4" fill="currentColor" />
        </svg>
    );
}
