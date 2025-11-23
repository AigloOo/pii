import { NextRequest, NextResponse } from 'next/server';
import { searchSequence } from '@/lib/db';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Only allow numeric search
    if (!/^\d+$/.test(q)) {
        return NextResponse.json({ error: 'Only numbers allowed' }, { status: 400 });
    }

    try {
        const index = await searchSequence(q);
        return NextResponse.json({
            found: index !== -1,
            index: index,
            sequence: q
        });
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
