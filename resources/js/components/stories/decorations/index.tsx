import type { DecorationKey } from '@/lib/stories/templates';
import { FloralDecoration } from './floral';
import { LeavesDecoration } from './leaves';

export function Decoration({ decoration, color }: { decoration: DecorationKey; color: string }) {
    if (decoration === 'floral') {
        return <FloralDecoration color={color} />;
    }

    if (decoration === 'folhas') {
        return <LeavesDecoration color={color} />;
    }

    return null;
}
