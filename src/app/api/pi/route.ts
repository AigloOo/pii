import { NextResponse } from 'next/server';
import { getDbState } from '@/lib/db';

// Prevent caching
export const dynamic = 'force-dynamic';

export async function GET() {
    const state = await getDbState();
    return NextResponse.json(state);
}

/*
export async function POST() {
    // ... deprecated in favor of background worker ...
}
*/
